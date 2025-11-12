import UserModel from '@/models/User.model';
import { generateTokens, verifyRefreshToken } from '@/lib/auth/jwt';
import type {
  LoginCredentials,
  AuthTokens,
  JWTPayload,
  CreateUserInput,
  UserResponse,
} from '@/types/user.types';
import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<{
    user: UserResponse;
    tokens: AuthTokens;
  }> {
    await connectDB();

    const { email, password } = credentials;

    // Find user by email (include password for comparison)
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId?.toString(),
    };

    const tokens = generateTokens(payload);

    // Return user without password
    const userResponse = user.toJSON() as unknown as UserResponse;

    return {
      user: userResponse,
      tokens,
    };
  }

  /**
   * Register a new user
   */
  static async register(userData: CreateUserInput): Promise<{
    user: UserResponse;
    tokens: AuthTokens;
  }> {
    await connectDB();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email.toLowerCase() });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create new user
    const user = await UserModel.create(userData);

    // Generate JWT tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId?.toString(),
    };

    const tokens = generateTokens(payload);

    // Return user without password
    const userResponse = user.toJSON() as unknown as UserResponse;

    return {
      user: userResponse,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    await connectDB();

    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist and are active
      const user = await UserModel.findById(payload.userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is deactivated');
      }

      // Generate new tokens
      const newPayload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        establishmentId: user.establishmentId?.toString(),
      };

      return generateTokens(newPayload);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Verify user credentials (without generating tokens)
   */
  static async verifyCredentials(credentials: LoginCredentials): Promise<boolean> {
    await connectDB();

    const { email, password } = credentials;

    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.isActive) {
      return false;
    }

    return await bcrypt.compare(password, user.password);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<UserResponse | null> {
    await connectDB();

    const user = await UserModel.findById(userId);

    if (!user) {
      return null;
    }

    return user.toJSON() as unknown as UserResponse;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserResponse | null> {
    await connectDB();

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return null;
    }

    return user.toJSON() as unknown as UserResponse;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await connectDB();

    const user = await UserModel.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Reset user password (admin function)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    await connectDB();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string): Promise<void> {
    await connectDB();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    await user.save();
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string): Promise<void> {
    await connectDB();

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = true;
    await user.save();
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    await connectDB();

    const user = await UserModel.findById(userId);

    if (!user || !user.isActive) {
      return false;
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    // Manager has most permissions for their establishment
    if (user.role === 'manager') {
      const managerPermissions = [
        'view_bookings',
        'create_bookings',
        'edit_bookings',
        'view_clients',
        'create_clients',
        'edit_clients',
        'view_accommodations',
        'edit_accommodations',
        'view_invoices',
        'create_invoices',
        'process_payments',
        'view_expenses',
        'create_expenses',
        'view_employees',
        'manage_attendance',
        'view_reports',
      ];
      return managerPermissions.includes(permission);
    }

    // Staff has specific permissions
    if (user.role === 'staff' && (user as any).permissions) {
      return (user as any).permissions.includes(permission as any);
    }

    return false;
  }
}

export default AuthService;
