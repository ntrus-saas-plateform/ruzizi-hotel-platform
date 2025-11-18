import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables must be set');
}

// Durées de validité
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 jours

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  establishmentId?: string;
}

/**
 * Générer un access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  console.log('🔑 Generating access token for user:', payload.userId, 'role:', payload.role);
  const token = jwt.sign(payload, JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  console.log('✅ Access token generated, expires in:', ACCESS_TOKEN_EXPIRY);
  return token;
}

/**
 * Générer un refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Générer les deux tokens (access et refresh) en même temps
 */
export function generateTokens(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Vérifier et décoder un access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    console.log('🔍 Verifying access token...');
    const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
    console.log('✅ Access token verified for user:', decoded.userId, 'role:', decoded.role);
    return decoded;
  } catch (error) {
    console.error('❌ Invalid access token:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Vérifier et décoder un refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    console.log('🔄 Verifying refresh token...');
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
    console.log('✅ Refresh token verified for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Invalid refresh token:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Décoder un token sans vérifier la signature (pour debug)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Vérifier si un token est expiré
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Obtenir le temps restant avant expiration (en secondes)
 */
export function getTokenTimeRemaining(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}
