import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/types/user.types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate environment variables
if (!JWT_SECRET || JWT_SECRET.length === 0) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length === 0) {
  throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'ruzizi-hotel',
    audience: 'ruzizi-hotel-api',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    issuer: 'ruzizi-hotel',
    audience: 'ruzizi-hotel-api',
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: JWTPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, {
      issuer: 'ruzizi-hotel',
      audience: 'ruzizi-hotel-api',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!, {
      issuer: 'ruzizi-hotel',
      audience: 'ruzizi-hotel-api',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode token without verification (useful for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}
