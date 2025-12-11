/**
 * Property-based tests for image access control
 * **Feature: image-optimization-system, Property 28: Access control enforcement**
 */

import * as fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import { withImageAccessControl, type ImageAccessContext } from '../access-control.middleware';
import { imageMetadataStore } from '../image-metadata-store';
import { Types } from 'mongoose';

// Mock the dependencies
jest.mock('../image-metadata-store');
jest.mock('@/lib/auth/middleware');
jest.mock('@/services/Audit.service');

const mockImageMetadataStore = imageMetadataStore as jest.Mocked<typeof imageMetadataStore>;

describe('Access Control - Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: image-optimization-system, Property 28: Access control enforcement**
   * **Validates: Requirements 7.3**
   * 
   * For any image request, the system should verify user permissions before serving the image
   */
  it('should enforce establishment-based access control for all image requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test scenarios with different user roles and establishment relationships
        fc.record({
          user: fc.record({
            userId: fc.constant(new Types.ObjectId().toString()),
            email: fc.emailAddress(),
            role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
            establishmentId: fc.option(fc.constant(new Types.ObjectId().toString()), { nil: undefined })
          }),
          requestUrl: fc.webUrl()
        }),
        async (testCase) => {
          // Arrange: Create consistent establishment IDs for testing
          const imageId = new Types.ObjectId().toString();
          const imageEstablishmentId = new Types.ObjectId();
          const userEstablishmentId = testCase.user.establishmentId ? new Types.ObjectId(testCase.user.establishmentId) : undefined;
          
          // Mock image metadata
          const mockMetadata = {
            _id: new Types.ObjectId(),
            establishmentId: imageEstablishmentId,
            originalFilename: 'test.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1000,
            dimensions: { width: 100, height: 100 },
            webpUrl: '/api/images/test.webp',
            jpegFallbackUrl: '/api/images/test.jpg',
            thumbnails: {
              small: { path: '/path/small.webp', width: 150, height: 150, fileSize: 500 },
              medium: { path: '/path/medium.webp', width: 300, height: 300, fileSize: 800 },
              large: { path: '/path/large.webp', width: 600, height: 400, fileSize: 1200 },
              xlarge: { path: '/path/xlarge.webp', width: 1200, height: 800, fileSize: 2000 }
            },
            uploadedAt: new Date(),
            uploadedBy: new Types.ObjectId(),
            // Add minimal Mongoose document methods to satisfy the interface
            toJSON: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            remove: jest.fn(),
            deleteOne: jest.fn(),
          } as any;

          mockImageMetadataStore.findById.mockResolvedValue(mockMetadata);

          // Mock authentication middleware
          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: true,
            user: {
              ...testCase.user,
              establishmentId: userEstablishmentId?.toString()
            }
          });

          // Create mock request
          const request = new NextRequest(testCase.requestUrl);

          // Create a test handler that should only be called if access is granted
          let handlerCalled = false;
          const testHandler = jest.fn(async () => {
            handlerCalled = true;
            return new NextResponse('success', { status: 200 });
          });

          // Apply access control middleware
          const protectedHandler = withImageAccessControl(testHandler);

          // Act: Attempt to access the image
          const response = await protectedHandler(request, { 
            params: { id: imageId } 
          });

          // Assert: Access control should be enforced based on user role and establishment
          const shouldHaveAccess = canUserAccessImage(
            { ...testCase.user, establishmentId: userEstablishmentId?.toString() }, 
            imageEstablishmentId.toString()
          );

          if (shouldHaveAccess) {
            // User should have access - handler should be called
            expect(handlerCalled).toBe(true);
            expect(response.status).toBe(200);
          } else {
            // User should not have access - handler should not be called
            expect(handlerCalled).toBe(false);
            expect(response.status).toBe(403);
            
            // Response should contain access denied message
            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('IMAGE_ACCESS_DENIED');
          }

          // Verify that image metadata was checked
          expect(mockImageMetadataStore.findById).toHaveBeenCalledWith(imageId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle non-existent images consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            userId: fc.constant(new Types.ObjectId().toString()),
            email: fc.emailAddress(),
            role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
            establishmentId: fc.option(fc.constant(new Types.ObjectId().toString()), { nil: undefined })
          }),
          requestUrl: fc.webUrl()
        }),
        async (testCase) => {
          // Arrange: Mock image not found
          const imageId = new Types.ObjectId().toString();
          mockImageMetadataStore.findById.mockResolvedValue(null);

          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: true,
            user: testCase.user
          });

          const request = new NextRequest(testCase.requestUrl);
          const testHandler = jest.fn(async () => new NextResponse('success', { status: 200 }));
          const protectedHandler = withImageAccessControl(testHandler);

          // Act: Attempt to access non-existent image
          const response = await protectedHandler(request, { 
            params: { id: imageId } 
          });

          // Assert: Should return 404 for non-existent images regardless of user role
          expect(response.status).toBe(404);
          expect(testHandler).not.toHaveBeenCalled();
          expect(mockImageMetadataStore.findById).toHaveBeenCalledWith(imageId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject unauthenticated requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          requestUrl: fc.webUrl(),
          authError: fc.constantFrom(
            'Token d\'authentification manquant',
            'Token invalide ou expiré',
            'Utilisateur non trouvé ou inactif'
          )
        }),
        async (testCase) => {
          // Arrange: Mock authentication failure
          const imageId = new Types.ObjectId().toString();
          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: false,
            error: testCase.authError
          });

          const request = new NextRequest(testCase.requestUrl);
          const testHandler = jest.fn(async () => new NextResponse('success', { status: 200 }));
          const protectedHandler = withImageAccessControl(testHandler);

          // Act: Attempt to access image without authentication
          const response = await protectedHandler(request, { 
            params: { id: imageId } 
          });

          // Assert: Should return 401 for unauthenticated requests
          expect(response).toBeDefined();
          expect(response.status).toBe(401);
          expect(testHandler).not.toHaveBeenCalled();
          
          const responseBody = await response.json();
          expect(responseBody.success).toBe(false);
          expect(responseBody.error.message).toContain('Authentification');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should add security headers to all responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            userId: fc.constant(new Types.ObjectId().toString()),
            email: fc.emailAddress(),
            role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
            establishmentId: fc.option(fc.constant(new Types.ObjectId().toString()), { nil: undefined })
          }),
          requestUrl: fc.webUrl()
        }),
        async (testCase) => {
          // Arrange: Mock successful scenario
          const imageId = new Types.ObjectId().toString();
          const mockMetadata = {
            _id: new Types.ObjectId(),
            establishmentId: new Types.ObjectId(),
            originalFilename: 'test.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1000,
            dimensions: { width: 100, height: 100 },
            webpUrl: '/api/images/test.webp',
            jpegFallbackUrl: '/api/images/test.jpg',
            thumbnails: {
              small: { path: '/path/small.webp', width: 150, height: 150, fileSize: 500 },
              medium: { path: '/path/medium.webp', width: 300, height: 300, fileSize: 800 },
              large: { path: '/path/large.webp', width: 600, height: 400, fileSize: 1200 },
              xlarge: { path: '/path/xlarge.webp', width: 1200, height: 800, fileSize: 2000 }
            },
            uploadedAt: new Date(),
            uploadedBy: new Types.ObjectId(),
            // Add minimal Mongoose document methods to satisfy the interface
            toJSON: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            remove: jest.fn(),
            deleteOne: jest.fn(),
          } as any;

          mockImageMetadataStore.findById.mockResolvedValue(mockMetadata);

          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: true,
            user: testCase.user
          });

          const request = new NextRequest(testCase.requestUrl);
          const testHandler = jest.fn(async () => new NextResponse('test content', { 
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' }
          }));
          const protectedHandler = withImageAccessControl(testHandler);

          // Act: Make request
          const response = await protectedHandler(request, { 
            params: { id: imageId } 
          });

          // Assert: Security headers should be present regardless of access outcome
          const expectedSecurityHeaders = [
            'X-Frame-Options',
            'Content-Security-Policy',
            'X-Content-Type-Options',
            'Referrer-Policy'
          ];

          expectedSecurityHeaders.forEach(headerName => {
            expect(response.headers.has(headerName)).toBe(true);
          });

          // Verify specific header values
          expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
          
          // Server headers should be removed
          expect(response.headers.has('Server')).toBe(false);
          expect(response.headers.has('X-Powered-By')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle system errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            userId: fc.constant(new Types.ObjectId().toString()),
            email: fc.emailAddress(),
            role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
            establishmentId: fc.option(fc.constant(new Types.ObjectId().toString()), { nil: undefined })
          }),
          requestUrl: fc.webUrl(),
          errorType: fc.constantFrom('database_error', 'network_error', 'timeout_error')
        }),
        async (testCase) => {
          // Arrange: Mock system error
          const imageId = new Types.ObjectId().toString();
          const error = new Error(`Simulated ${testCase.errorType}`);
          mockImageMetadataStore.findById.mockRejectedValue(error);

          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: true,
            user: testCase.user
          });

          const request = new NextRequest(testCase.requestUrl);
          const testHandler = jest.fn(async () => new NextResponse('success', { status: 200 }));
          const protectedHandler = withImageAccessControl(testHandler);

          // Act: Attempt to access image during system error
          const response = await protectedHandler(request, { 
            params: { id: imageId } 
          });

          // Assert: Should handle errors gracefully
          expect(response.status).toBe(500);
          expect(testHandler).not.toHaveBeenCalled();
          
          const responseText = await response.text();
          expect(responseText).toBe('Internal server error');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent access decisions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            userId: fc.constant(new Types.ObjectId().toString()),
            email: fc.emailAddress(),
            role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
            establishmentId: fc.option(fc.constant(new Types.ObjectId().toString()), { nil: undefined })
          }),
          requestUrl: fc.webUrl(),
          iterations: fc.integer({ min: 3, max: 10 })
        }),
        async (testCase) => {
          // Arrange: Mock consistent metadata
          const imageId = new Types.ObjectId().toString();
          const mockMetadata = {
            _id: new Types.ObjectId(),
            establishmentId: new Types.ObjectId(),
            originalFilename: 'test.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1000,
            dimensions: { width: 100, height: 100 },
            webpUrl: '/api/images/test.webp',
            jpegFallbackUrl: '/api/images/test.jpg',
            thumbnails: {
              small: { path: '/path/small.webp', width: 150, height: 150, fileSize: 500 },
              medium: { path: '/path/medium.webp', width: 300, height: 300, fileSize: 800 },
              large: { path: '/path/large.webp', width: 600, height: 400, fileSize: 1200 },
              xlarge: { path: '/path/xlarge.webp', width: 1200, height: 800, fileSize: 2000 }
            },
            uploadedAt: new Date(),
            uploadedBy: new Types.ObjectId(),
            // Add minimal Mongoose document methods to satisfy the interface
            toJSON: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            remove: jest.fn(),
            deleteOne: jest.fn(),
          } as any;

          const { authenticateUser } = require('@/lib/auth/middleware');
          authenticateUser.mockResolvedValue({
            success: true,
            user: testCase.user
          });

          // Act: Make multiple requests with same parameters
          const responses = await Promise.all(
            Array.from({ length: testCase.iterations }, async () => {
              mockImageMetadataStore.findById.mockResolvedValue(mockMetadata);
              
              const request = new NextRequest(testCase.requestUrl);
              const testHandler = jest.fn(async () => new NextResponse('success', { status: 200 }));
              const protectedHandler = withImageAccessControl(testHandler);
              
              return protectedHandler(request, { params: { id: imageId } });
            })
          );

          // Assert: All responses should have consistent status codes
          const firstStatus = responses[0].status;
          responses.forEach(response => {
            expect(response.status).toBe(firstStatus);
          });

          // All responses should have security headers
          responses.forEach(response => {
            expect(response.headers.has('X-Frame-Options')).toBe(true);
            expect(response.headers.has('X-Content-Type-Options')).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Helper function to determine if a user should have access to an image
 * Mirrors the logic in the access control middleware
 */
function canUserAccessImage(
  user: { role: string; establishmentId?: string },
  imageEstablishmentId: string
): boolean {
  // Root and super_admin can access all images
  if (user.role === 'root' || user.role === 'super_admin') {
    return true;
  }

  // Manager and staff can only access images from their establishment
  if ((user.role === 'manager' || user.role === 'staff') && user.establishmentId) {
    return user.establishmentId === imageEstablishmentId;
  }

  // If no establishment ID is set for the user, deny access
  return false;
}