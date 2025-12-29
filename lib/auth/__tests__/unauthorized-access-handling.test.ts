/**
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

// Mock console methods to capture logging
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleLog = jest.fn();

// Store original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
};

// Generators for property-based testing
const establishmentIdArb = fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0);

const nonAdminUserArb = fc.record({
  userId: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  role: fc.constantFrom('manager', 'staff'),
  establishmentId: establishmentIdArb,
});

const adminUserArb = fc.record({
  userId: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  role: fc.constantFrom('root', 'super_admin'),
  establishmentId: fc.option(establishmentIdArb, { nil: undefined }),
});

const resourceArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  establishmentId: establishmentIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
});

describe('Unauthorized Access Handling Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    // Restore original console methods
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.log = originalConsole.log;
  });

  /**
   * Property 10: Unauthorized Access Handling
   * Validates: Requirements 4.3, 4.5
   */
  describe('Property 10: Unauthorized Access Handling', () => {
    test('**Feature: auth-establishment-improvement, Property 10: Unauthorized Access Handling**', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          resourceArb,
          establishmentIdArb,
          async (user, resource, differentEstablishmentId) => {
            // Ensure the resource belongs to a different establishment than the user
            fc.pre(resource.establishmentId !== user.establishmentId);
            fc.pre(differentEstablishmentId !== user.establishmentId);
            fc.pre(differentEstablishmentId !== resource.establishmentId);

            // Create establishment context for non-admin user
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Non-admin users should not be able to access resources from different establishments
            const hasAccess = await context.validateAccess(resource, 'test-resource');
            expect(hasAccess).toBe(false);

            // Property: EstablishmentAccessDeniedError should provide clear error messages
            const error = new EstablishmentAccessDeniedError({
              userId: user.userId,
              resourceType: 'test-resource',
              resourceId: resource.id,
              userEstablishmentId: user.establishmentId,
              resourceEstablishmentId: resource.establishmentId,
            });

            // Verify error properties
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('ESTABLISHMENT_ACCESS_DENIED');
            expect(error.message).toBe('Access denied: Resource belongs to a different establishment');
            expect(error.details).toEqual({
              userId: user.userId,
              resourceType: 'test-resource',
              resourceId: resource.id,
              userEstablishmentId: user.establishmentId,
              resourceEstablishmentId: resource.establishmentId,
            });

            // Property: Error should be serializable to JSON with proper structure
            const errorJson = error.toJSON();
            expect(errorJson).toEqual({
              success: false,
              error: {
                code: 'ESTABLISHMENT_ACCESS_DENIED',
                message: 'Access denied: Resource belongs to a different establishment',
                details: {
                  userId: user.userId,
                  resourceType: 'test-resource',
                  resourceId: resource.id,
                  userEstablishmentId: user.establishmentId,
                  resourceEstablishmentId: resource.establishmentId,
                },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Admin users should have access to all establishments', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          resourceArb,
          async (user, resource) => {
            // Create establishment context for admin user
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Admin users should be able to access resources from any establishment
            const hasAccess = await context.validateAccess(resource, 'test-resource');
            expect(hasAccess).toBe(true);

            // Property: Admin users should be identified correctly
            expect(context.canAccessAll()).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Non-admin users should only access their own establishment resources', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          resourceArb,
          async (user, resource) => {
            // Create a resource that belongs to the user's establishment
            const userResource = {
              ...resource,
              establishmentId: user.establishmentId,
            };

            // Create establishment context for non-admin user
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Non-admin users should be able to access resources from their own establishment
            const hasAccess = await context.validateAccess(userResource, 'test-resource');
            expect(hasAccess).toBe(true);

            // Property: Non-admin users should not be able to access all establishments
            expect(context.canAccessAll()).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Access validation should handle missing establishmentId', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
          async (user, resourceId) => {
            // Create a resource without establishmentId
            const resourceWithoutEstablishment = {
              id: resourceId,
              name: 'Test Resource',
              // establishmentId is missing
            };

            // Create establishment context for non-admin user
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Resources without establishmentId should be denied access
            const hasAccess = await context.validateAccess(resourceWithoutEstablishment, 'test-resource');
            expect(hasAccess).toBe(false);

            // Property: Warning should be logged for resources without establishmentId
            expect(mockConsoleWarn).toHaveBeenCalledWith('Resource test-resource has no establishmentId');
          }
        ),
        { numRuns: 30 }
      );
    });

    test('Cross-establishment relationship validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          resourceArb,
          resourceArb,
          async (user, parentResource, childResource) => {
            // Ensure parent and child belong to different establishments
            fc.pre(parentResource.establishmentId !== childResource.establishmentId);

            // Create establishment context
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Cross-establishment relationships should be invalid
            const relationshipResult = await context.validateRelationship(
              parentResource,
              childResource,
              'test-relationship'
            );

            expect(relationshipResult.valid).toBe(false);
            expect(relationshipResult.error).toContain('Cross-establishment relationship detected');
            expect(relationshipResult.error).toContain('test-relationship');
            expect(relationshipResult.error).toContain(parentResource.establishmentId);
            expect(relationshipResult.error).toContain(childResource.establishmentId);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Same-establishment relationship validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          resourceArb,
          async (user, resource) => {
            // Create two resources in the same establishment
            const parentResource = { ...resource, id: resource.id + '_parent' };
            const childResource = { ...resource, id: resource.id + '_child' };

            // Create establishment context
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Same-establishment relationships should be valid
            const relationshipResult = await context.validateRelationship(
              parentResource,
              childResource,
              'test-relationship'
            );

            expect(relationshipResult.valid).toBe(true);
            expect(relationshipResult.error).toBeUndefined();
          }
        ),
        { numRuns: 30 }
      );
    });

    test('Error handling for resources without establishmentId in relationships', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          resourceArb,
          async (user, resource) => {
            // Create resources where one is missing establishmentId
            const parentResource = resource;
            const childResourceWithoutEstablishment = {
              id: resource.id + '_child',
              name: 'Child Resource',
              // establishmentId is missing
            };

            // Create establishment context
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Relationships with missing establishmentId should be invalid
            const relationshipResult = await context.validateRelationship(
              parentResource,
              childResourceWithoutEstablishment,
              'test-relationship'
            );

            expect(relationshipResult.valid).toBe(false);
            expect(relationshipResult.error).toContain('Child resource in test-relationship has no establishmentId');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Context helper methods should work correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(nonAdminUserArb, adminUserArb),
          async (user) => {
            // Create establishment context
            const context = new EstablishmentServiceContext(
              user.userId,
              user.role,
              user.establishmentId
            );

            // Property: Context should return correct user information
            expect(context.getUserId()).toBe(user.userId);
            expect(context.getRole()).toBe(user.role);
            expect(context.getEstablishmentId()).toBe(user.establishmentId);

            // Property: canAccessAll should be correct based on role
            const expectedCanAccessAll = user.role === 'root' || user.role === 'super_admin';
            expect(context.canAccessAll()).toBe(expectedCanAccessAll);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Context factory method should work correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(nonAdminUserArb, adminUserArb),
          async (user) => {
            // Create context using factory method
            const context = EstablishmentServiceContext.fromUser(user);

            // Property: Factory method should create equivalent context
            expect(context.getUserId()).toBe(user.userId);
            expect(context.getRole()).toBe(user.role);
            expect(context.getEstablishmentId()).toBe(user.establishmentId);

            const expectedCanAccessAll = user.role === 'root' || user.role === 'super_admin';
            expect(context.canAccessAll()).toBe(expectedCanAccessAll);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});