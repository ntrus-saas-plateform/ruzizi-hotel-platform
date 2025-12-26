import { Types } from 'mongoose';

/**
 * User roles in the system
 */
export type UserRole = 'root' | 'super_admin' | 'manager' | 'staff';

/**
 * System permissions
 */
export type SystemPermission =
  | 'manage_users'
  | 'manage_establishments'
  | 'manage_accommodations'
  | 'manage_bookings'
  | 'manage_payments'
  | 'view_reports'
  | 'manage_system'
  | 'manage_settings'
  | 'view_bookings'
  | 'create_bookings'
  | 'edit_bookings'
  | 'delete_bookings'
  | 'view_clients'
  | 'create_clients'
  | 'edit_clients'
  | 'view_accommodations'
  | 'edit_accommodations'
  | 'view_invoices'
  | 'create_invoices'
  | 'process_payments'
  | 'view_expenses'
  | 'create_expenses'
  | 'view_employees'
  | 'manage_attendance';

/**
 * Legacy alias for backward compatibility
 */
export type StaffPermission = SystemPermission;

/**
 * User profile information
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
}

/**
 * User document interface
 */
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  permissions?: StaffPermission[];
  establishmentId?: Types.ObjectId;
  profile: UserProfile;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation input (without auto-generated fields)
 */
export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  permissions?: SystemPermission[];
  establishmentId?: string;
  profile: UserProfile;
  isActive?: boolean;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: UserRole;
  permissions?: SystemPermission[];
  establishmentId?: string;
  profile?: Partial<UserProfile>;
  isActive?: boolean;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  permissions?: SystemPermission[];
  establishmentId?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Auth tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT payload with standard JWT claims
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  establishmentId?: string;
  // Standard JWT claims
  exp?: number; // Expiration time (seconds since Unix epoch)
  iat?: number; // Issued at time (seconds since Unix epoch)
  nbf?: number; // Not before time (seconds since Unix epoch)
  iss?: string; // Issuer
  aud?: string; // Audience
  sub?: string; // Subject
  jti?: string; // JWT ID
}
