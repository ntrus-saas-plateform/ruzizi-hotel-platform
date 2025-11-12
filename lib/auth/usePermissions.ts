'use client';

import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { StaffPermission } from '@/types/user.types';

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useMemo(() => {
    return (permission: StaffPermission): boolean => {
      if (!user) {
        return false;
      }

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return true;
      }

      // Manager has most permissions
      if (user.role === 'manager') {
        const managerPermissions: StaffPermission[] = [
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
      if (user.role === 'staff' && user.permissions) {
        return user.permissions.includes(permission);
      }

      return false;
    };
  }, [user]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: StaffPermission[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    };
  }, [hasPermission]);

  const hasAllPermissions = useMemo(() => {
    return (permissions: StaffPermission[]): boolean => {
      return permissions.every((permission) => hasPermission(permission));
    };
  }, [hasPermission]);

  const isSuperAdmin = useMemo(() => {
    return user?.role === 'super_admin';
  }, [user]);

  const isManager = useMemo(() => {
    return user?.role === 'manager' || user?.role === 'super_admin';
  }, [user]);

  const isStaff = useMemo(() => {
    return user?.role === 'staff';
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isManager,
    isStaff,
  };
}
