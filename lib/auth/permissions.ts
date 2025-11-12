import type { UserRole, SystemPermission } from '@/types/user.types';

/**
 * Définition des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, SystemPermission[]> = {
  root: [
    'manage_users',
    'manage_establishments',
    'manage_accommodations',
    'manage_bookings',
    'manage_payments',
    'view_reports',
    'manage_system',
    'manage_settings',
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
  ],
  super_admin: [
    'manage_users',
    'manage_establishments',
    'manage_accommodations',
    'manage_bookings',
    'manage_payments',
    'view_reports',
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
  ],
  manager: [
    'manage_accommodations',
    'manage_bookings',
    'view_reports',
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
  ],
  staff: [
    'view_bookings',
    'create_bookings',
    'edit_bookings',
    'view_clients',
    'create_clients',
    'edit_clients',
    'view_accommodations',
  ],
};

/**
 * Vérifier si un rôle a une permission spécifique
 */
export function hasRolePermission(role: UserRole, permission: SystemPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Obtenir toutes les permissions d'un rôle
 */
export function getRolePermissions(role: UserRole): SystemPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Vérifier si un utilisateur a une permission (en tenant compte des permissions personnalisées)
 */
export function hasUserPermission(
  userRole: UserRole,
  userPermissions: SystemPermission[] | undefined,
  requiredPermission: SystemPermission
): boolean {
  // Vérifier d'abord les permissions du rôle
  if (hasRolePermission(userRole, requiredPermission)) {
    return true;
  }

  // Ensuite vérifier les permissions personnalisées (pour le staff principalement)
  if (userPermissions && userPermissions.includes(requiredPermission)) {
    return true;
  }

  return false;
}

/**
 * Descriptions des permissions pour l'interface utilisateur
 */
export const PERMISSION_DESCRIPTIONS: Record<SystemPermission, { fr: string; en: string }> = {
  manage_users: {
    fr: 'Gérer les utilisateurs',
    en: 'Manage users',
  },
  manage_establishments: {
    fr: 'Gérer les établissements',
    en: 'Manage establishments',
  },
  manage_accommodations: {
    fr: 'Gérer les hébergements',
    en: 'Manage accommodations',
  },
  manage_bookings: {
    fr: 'Gérer les réservations',
    en: 'Manage bookings',
  },
  manage_payments: {
    fr: 'Gérer les paiements',
    en: 'Manage payments',
  },
  view_reports: {
    fr: 'Voir les rapports',
    en: 'View reports',
  },
  manage_system: {
    fr: 'Gérer le système',
    en: 'Manage system',
  },
  manage_settings: {
    fr: 'Gérer les paramètres',
    en: 'Manage settings',
  },
  view_bookings: {
    fr: 'Voir les réservations',
    en: 'View bookings',
  },
  create_bookings: {
    fr: 'Créer des réservations',
    en: 'Create bookings',
  },
  edit_bookings: {
    fr: 'Modifier les réservations',
    en: 'Edit bookings',
  },
  delete_bookings: {
    fr: 'Supprimer les réservations',
    en: 'Delete bookings',
  },
  view_clients: {
    fr: 'Voir les clients',
    en: 'View clients',
  },
  create_clients: {
    fr: 'Créer des clients',
    en: 'Create clients',
  },
  edit_clients: {
    fr: 'Modifier les clients',
    en: 'Edit clients',
  },
  view_accommodations: {
    fr: 'Voir les hébergements',
    en: 'View accommodations',
  },
  edit_accommodations: {
    fr: 'Modifier les hébergements',
    en: 'Edit accommodations',
  },
  view_invoices: {
    fr: 'Voir les factures',
    en: 'View invoices',
  },
  create_invoices: {
    fr: 'Créer des factures',
    en: 'Create invoices',
  },
  process_payments: {
    fr: 'Traiter les paiements',
    en: 'Process payments',
  },
  view_expenses: {
    fr: 'Voir les dépenses',
    en: 'View expenses',
  },
  create_expenses: {
    fr: 'Créer des dépenses',
    en: 'Create expenses',
  },
  view_employees: {
    fr: 'Voir les employés',
    en: 'View employees',
  },
  manage_attendance: {
    fr: 'Gérer les présences',
    en: 'Manage attendance',
  },
};

/**
 * Groupes de permissions pour l'interface utilisateur
 */
export const PERMISSION_GROUPS = {
  system: {
    fr: 'Système',
    en: 'System',
    permissions: ['manage_system', 'manage_settings'] as SystemPermission[],
  },
  users: {
    fr: 'Utilisateurs',
    en: 'Users',
    permissions: ['manage_users'] as SystemPermission[],
  },
  establishments: {
    fr: 'Établissements',
    en: 'Establishments',
    permissions: ['manage_establishments', 'manage_accommodations', 'view_accommodations', 'edit_accommodations'] as SystemPermission[],
  },
  bookings: {
    fr: 'Réservations',
    en: 'Bookings',
    permissions: ['manage_bookings', 'view_bookings', 'create_bookings', 'edit_bookings', 'delete_bookings'] as SystemPermission[],
  },
  clients: {
    fr: 'Clients',
    en: 'Clients',
    permissions: ['view_clients', 'create_clients', 'edit_clients'] as SystemPermission[],
  },
  finance: {
    fr: 'Finance',
    en: 'Finance',
    permissions: ['manage_payments', 'view_invoices', 'create_invoices', 'process_payments', 'view_expenses', 'create_expenses'] as SystemPermission[],
  },
  hr: {
    fr: 'Ressources Humaines',
    en: 'Human Resources',
    permissions: ['view_employees', 'manage_attendance'] as SystemPermission[],
  },
  reports: {
    fr: 'Rapports',
    en: 'Reports',
    permissions: ['view_reports'] as SystemPermission[],
  },
} as const;