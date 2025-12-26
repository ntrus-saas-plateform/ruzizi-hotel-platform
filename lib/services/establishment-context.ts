import { Types } from 'mongoose';
import type { UserRole } from '@/types/user.types';

/**
 * Establishment Service Context
 * Provides establishment-based filtering and access control for service layer operations
 */
export class EstablishmentServiceContext {
  constructor(
    private userId: string,
    private role: UserRole,
    private establishmentId?: string
  ) {
    // Note: establishmentId can be undefined for non-admin users in some contexts
    // (e.g., when listing establishments to assign to a user)
  }

  /**
   * Apply establishment filter to a query filter object
   * For non-admin users with establishmentId, adds establishmentId to the filter
   * For non-admin users without establishmentId, returns filter unchanged (can see all)
   * For admin users, returns the filter unchanged (unless they want to filter by establishment)
   */
  applyFilter<T extends Record<string, any>>(baseFilter: T): T & { establishmentId?: string | Types.ObjectId } {
    // If user can access all establishments, return filter as-is
    if (this.canAccessAll()) {
      return baseFilter;
    }

    // For non-admin users with establishmentId, enforce establishment filter
    if (this.establishmentId) {
      return {
        ...baseFilter,
        establishmentId: this.establishmentId,
      };
    }

    // For non-admin users without establishmentId, return filter unchanged
    // (they can see all establishments to select one)
    return baseFilter;
  }

  /**
   * Validate if user can access a specific resource
   * Checks if the resource's establishmentId matches the user's establishment
   */
  async validateAccess(
    resource: { establishmentId?: string | Types.ObjectId },
    resourceType: string
  ): Promise<boolean> {
    // Admins can access everything
    if (this.canAccessAll()) {
      return true;
    }

    // If user has no establishmentId, they can access all resources
    // (useful when assigning establishments to users)
    if (!this.establishmentId) {
      return true;
    }

    // Check if resource has an establishmentId
    if (!resource.establishmentId) {
      console.warn(`Resource ${resourceType} has no establishmentId`);
      return false;
    }

    // Convert to string for comparison
    const resourceEstId = resource.establishmentId.toString();
    const userEstId = this.establishmentId;

    return resourceEstId === userEstId;
  }

  /**
   * Validate relationship integrity between resources
   * Ensures all resources in a relationship belong to the same establishment
   */
  async validateRelationship(
    parentResource: { establishmentId?: string | Types.ObjectId },
    childResource: { establishmentId?: string | Types.ObjectId },
    relationshipName: string = 'resource relationship'
  ): Promise<{ valid: boolean; error?: string }> {
    // Check if both resources have establishmentId
    if (!parentResource.establishmentId) {
      return {
        valid: false,
        error: `Parent resource in ${relationshipName} has no establishmentId`,
      };
    }

    if (!childResource.establishmentId) {
      return {
        valid: false,
        error: `Child resource in ${relationshipName} has no establishmentId`,
      };
    }

    // Convert to strings for comparison
    const parentEstId = parentResource.establishmentId.toString();
    const childEstId = childResource.establishmentId.toString();

    if (parentEstId !== childEstId) {
      return {
        valid: false,
        error: `Cross-establishment relationship detected in ${relationshipName}: parent (${parentEstId}) != child (${childEstId})`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if user can access all establishments
   * Returns true for root and super_admin roles
   */
  canAccessAll(): boolean {
    return this.role === 'root' || this.role === 'super_admin';
  }

  /**
   * Get the user's establishment ID
   */
  getEstablishmentId(): string | undefined {
    return this.establishmentId;
  }

  /**
   * Get the user's role
   */
  getRole(): UserRole {
    return this.role;
  }

  /**
   * Get the user's ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Create a context from user data
   * Helper factory method
   */
  static fromUser(user: {
    userId: string;
    role: UserRole;
    establishmentId?: string;
  }): EstablishmentServiceContext {
    return new EstablishmentServiceContext(
      user.userId,
      user.role,
      user.establishmentId
    );
  }
}
