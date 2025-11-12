/**
 * Authentication module
 * Centralized exports for authentication utilities
 */

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
} from './jwt';

export {
  verifyAuth,
  requireAuth,
  requireRole,
  requireSuperAdmin,
  requireManager,
  createErrorResponse,
  createSuccessResponse,
  withAuth,
  withRole,
  withPermission,
  authenticateUser,
  requirePermission,
  createAuthErrorResponse,
  requireAdmin,
} from './middleware';
