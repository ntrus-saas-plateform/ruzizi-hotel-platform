import { PipelineStage } from 'mongoose';
import User, { IUser } from '@/models/User.model';
import connectDB from '@/lib/db/mongodb';
import crypto from 'crypto';

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
  async create(data: CreateUserInput) {
    try {
      await connectDB();

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      const user = await User.create(data);

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
  async getAll(filters: {
    role?: string;
    establishmentId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      await connectDB();

      const page = Math.max(1, filters.page || 1);
      const limit = Math.max(1, Math.min(100, filters.limit || 20));
      const skip = (page - 1) * limit;

      const query: any = {};

      if (filters.role) query.role = filters.role;
      if (filters.establishmentId) query.establishmentId = filters.establishmentId;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ];
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
  async getById(id: string) {
    try {
      await connectDB();

      const user = await User.findById(id)
        .populate('establishmentId', 'name')
        .select('-password');

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer un utilisateur par email
  async getByEmail(email: string) {
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
  async update(id: string, data: UpdateUserInput) {
    try {
      await connectDB();

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (data.email) {
        const existingUser = await User.findOne({
          email: data.email,
          _id: { $ne: id },
        });
        if (existingUser) {
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
  async changePassword(id: string, newPassword: string) {
    try {
      await connectDB();

      const user = await User.findById(id);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
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
  async deactivate(id: string) {
    try {
      await connectDB();

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
  async activate(id: string) {
    try {
      await connectDB();

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
  async delete(id: string) {
    try {
      await connectDB();

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
  async recordLogin(id: string, ipAddress: string, userAgent: string) {
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
  async generatePasswordResetToken(email: string) {
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
  async resetPassword(token: string, newPassword: string) {
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
  async getStats() {
    try {
      await connectDB();

      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] },
            },
          },
        },
      ] as PipelineStage[]);

      const total = await User.countDocuments();
      const active = await User.countDocuments({ isActive: true });

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

export default new UserService();
