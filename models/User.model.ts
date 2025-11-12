import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  name?: string; // Computed field
  email: string;
  phone?: string;
  password: string;
  role: 'root' | 'super_admin' | 'manager' | 'staff';
  establishmentId?: mongoose.Types.ObjectId;
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  loginHistory: {
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: ['root', 'super_admin', 'manager', 'staff'],
      default: 'staff',
      required: true,
    },
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
    },
    permissions: [{
      type: String,
      enum: [
        'manage_users',
        'manage_establishments',
        'manage_accommodations',
        'manage_bookings',
        'manage_payments',
        'view_reports',
        'manage_system',
        'manage_settings'
      ]
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
      },
    ],
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ establishmentId: 1 });
UserSchema.index({ isActive: 1 });

// Hash password avant sauvegarde
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual pour le nom complet
UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Limiter l'historique de connexion à 50 entrées
UserSchema.pre('save', function (next) {
  if (this.loginHistory && this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  next();
});

// Assigner les permissions par défaut selon le rôle
UserSchema.pre('save', function (next) {
  if (this.isModified('role') || this.isNew) {
    switch (this.role) {
      case 'root':
        this.permissions = [
          'manage_users',
          'manage_establishments',
          'manage_accommodations',
          'manage_bookings',
          'manage_payments',
          'view_reports',
          'manage_system',
          'manage_settings'
        ];
        break;
      case 'super_admin':
        this.permissions = [
          'manage_users',
          'manage_establishments',
          'manage_accommodations',
          'manage_bookings',
          'manage_payments',
          'view_reports'
        ];
        break;
      case 'manager':
        this.permissions = [
          'manage_accommodations',
          'manage_bookings',
          'view_reports'
        ];
        break;
      case 'staff':
        this.permissions = [
          'manage_bookings'
        ];
        break;
    }
  }
  next();
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
