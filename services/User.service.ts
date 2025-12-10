import { PipelineStage } from 'mongoose';
import User from '@/models/User.model';
import connectDB from '@/lib/db/mongodb';
import crypto from 'crypto';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'manager' | 'staff';
  establishmentId?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'super_admin' | 'manager' | 'staff';
  establishmentId?: string;
  isActive?: boolean;
}

class UserService {
  // Créer un utilisateur
  static async create(data: CreateUserInput, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      // For non-admin users, enforce establishment assignment
      let finalData = { ...data };
      if (context && !context.canAccessAll()) {
        // Non-admin users can only create users in their establishment
        finalData.establishmentId = context.getEstablishmentId();
      }

      const user = await User.create(finalData);

      // Retourner sans le mot de passe
      const userObject = user.toObject();
      delete (userObject as any).password;

      return userObject;
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer tous les utilisateurs avec pagination
  static async getAll(filters: {
    role?: string;
    establishmentId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      const page = Math.max(1, filters.page || 1);
      const limit = Math.max(1, Math.min(100, filters.limit || 20));
      const skip = (page - 1) * limit;

      let query: any = {};

      if (filters.role) query.role = filters.role;
      if (filters.establishmentId) query.establishmentId = filters.establishmentId;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ];
      }

      // Apply establishment filtering for non-admin users
      if (context) {
        query = context.applyFilter(query);
      }

      // Get total count for pagination
      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const users = await User.find(query)
        .populate('establishmentId', 'name')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  // Récupérer un utilisateur par ID
  static async getById(id: string, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      const user = await User.findById(id)
        .populate('establishmentId', 'name')
        .select('-password');

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(user, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: user.establishmentId?.toString() || '',
          });
        }
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer un utilisateur par email
  // Note: This method is typically used for authentication, so it doesn't apply establishment filtering
  static async getByEmail(email: string) {
    try {
      await connectDB();

      const user = await User.findOne({ email })
        .populate('establishmentId', 'name')
        .select('+password');

      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur
  static async update(id: string, data: UpdateUserInput, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // First, get the user to validate access
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(existingUser, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: existingUser.establishmentId?.toString() || '',
          });
        }

        // Non-admin users cannot change establishmentId
        if (data.establishmentId && data.establishmentId !== context.getEstablishmentId()) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: data.establishmentId,
          });
        }
      }

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (data.email) {
        const existingUserWithEmail = await User.findOne({
          email: data.email,
          _id: { $ne: id },
        });
        if (existingUserWithEmail) {
          throw new Error('Cet email est déjà utilisé');
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      )
        .populate('establishmentId', 'name')
        .select('-password');

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  // Changer le mot de passe
  static async changePassword(id: string, newPassword: string, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      const user = await User.findById(id);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(user, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: user.establishmentId?.toString() || '',
          });
        }
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Mot de passe modifié avec succès' };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  // Désactiver un utilisateur
  static async deactivate(id: string, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // First, get the user to validate access
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(existingUser, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: existingUser.establishmentId?.toString() || '',
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
      throw error;
    }
  }

  // Activer un utilisateur
  static async activate(id: string, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // First, get the user to validate access
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(existingUser, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: existingUser.establishmentId?.toString() || '',
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  static async delete(id: string, context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // First, get the user to validate access
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate access for non-admin users
      if (context && !context.canAccessAll()) {
        const hasAccess = await context.validateAccess(existingUser, 'user');
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'user',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: existingUser.establishmentId?.toString() || '',
          });
        }
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return { message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  // Enregistrer une connexion
  // Note: This method doesn't require establishment context as it's used during authentication
  static async recordLogin(id: string, ipAddress: string, userAgent: string) {
    try {
      await connectDB();

      await User.findByIdAndUpdate(id, {
        lastLogin: new Date(),
        $push: {
          loginHistory: {
            timestamp: new Date(),
            ipAddress,
            userAgent,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la connexion:', error);
    }
  }

  // Générer un token de réinitialisation de mot de passe
  // Note: This method doesn't require establishment context as it's used for password reset
  static async generatePasswordResetToken(email: string) {
    try {
      await connectDB();

      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Aucun utilisateur trouvé avec cet email');
      }

      // Générer un token aléatoire
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hasher le token avant de le sauvegarder
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Sauvegarder le token hashé et l'expiration (1 heure)
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 heure
      await user.save();

      // Retourner le token non hashé (à envoyer par email)
      return resetToken;
    } catch (error) {
      console.error('Erreur lors de la génération du token:', error);
      throw error;
    }
  }

  // Réinitialiser le mot de passe avec le token
  // Note: This method doesn't require establishment context as it's used for password reset
  static async resetPassword(token: string, newPassword: string) {
    try {
      await connectDB();

      // Hasher le token reçu pour le comparer
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Trouver l'utilisateur avec ce token et vérifier l'expiration
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Token invalide ou expiré');
      }

      // Mettre à jour le mot de passe
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des utilisateurs
  static async getStats(context?: EstablishmentServiceContext) {
    try {
      await connectDB();

      // Build match stage for establishment filtering
      const matchStage: any = {};
      if (context && !context.canAccessAll()) {
        matchStage.establishmentId = context.getEstablishmentId();
      }

      const pipeline: PipelineStage[] = [];
      
      // Add match stage if filtering is needed
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage } as PipelineStage);
      }

      pipeline.push({
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
        },
      } as PipelineStage);

      const stats = await User.aggregate(pipeline);

      // Apply filtering to count queries as well
      const countQuery = context && !context.canAccessAll() 
        ? { establishmentId: context.getEstablishmentId() }
        : {};

      const total = await User.countDocuments(countQuery);
      const active = await User.countDocuments({ ...countQuery, isActive: true });

      return {
        total,
        active,
        inactive: total - active,
        byRole: stats,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

// Export as class-based service (no instance)
export default UserService;
