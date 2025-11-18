import { z } from 'zod';

/**
 * User role enum
 */
export const UserRoleSchema = z.enum(['super_admin', 'manager', 'staff']);

/**
 * Staff permissions enum
 */
export const StaffPermissionSchema = z.enum([
  'view_bookings',
  'create_bookings',
  'edit_bookings',
  'delete_bookings',
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
]);

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

/**
 * Create user validation schema
 */
export const CreateUserSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    role: UserRoleSchema,
    permissions: z.array(StaffPermissionSchema).optional(),
    establishmentId: z.string().optional(),
    profile: UserProfileSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Manager and staff must have an establishmentId
      if ((data.role === 'manager' || data.role === 'staff') && !data.establishmentId) {
        return false;
      }
      return true;
    },
    {
      message: 'Manager and staff users must be assigned to an establishment',
      path: ['establishmentId'],
    }
  )
  .refine(
    (data) => {
      // Only staff can have permissions
      if (data.permissions && data.role !== 'staff') {
        return false;
      }
      return true;
    },
    {
      message: 'Only staff users can have specific permissions',
      path: ['permissions'],
    }
  );

/**
 * Update user validation schema
 */
export const UpdateUserSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .optional(),
    role: UserRoleSchema.optional(),
    permissions: z.array(StaffPermissionSchema).optional(),
    establishmentId: z.string().optional(),
    profile: UserProfileSchema.partial().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If role is being changed to manager/staff, establishmentId must be provided
      if (
        data.role &&
        (data.role === 'manager' || data.role === 'staff') &&
        data.establishmentId === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Manager and staff users must be assigned to an establishment',
      path: ['establishmentId'],
    }
  );

/**
 * Login credentials validation schema
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Change password validation schema
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Reset password validation schema
 */
export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * User filter schema for GET requests
 */
export const UserFilterSchema = z.object({
  role: UserRoleSchema.optional(),
  establishmentId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types inferred from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UserFilterInput = z.infer<typeof UserFilterSchema>;
