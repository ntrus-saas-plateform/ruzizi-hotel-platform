// Simple in-memory token blacklist
// In production, use Redis or database for persistence

interface BlacklistedToken {
  token: string;
  expiresAt: number; // timestamp when the token would naturally expire
}

const tokenBlacklist = new Map<string, BlacklistedToken>();

/**
 * Add a token to the blacklist
 */
export function blacklistToken(token: string): void {
  try {
    // Extract expiration time from token
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiresAt = payload.exp * 1000; // Convert to milliseconds

    tokenBlacklist.set(token, {
      token,
      expiresAt,
    });

    console.log(`Token blacklisted, expires at: ${new Date(expiresAt).toISOString()}`);
  } catch (error) {
    console.error('Failed to blacklist token:', error);
  }
}

/**
 * Check if a token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  const blacklistedToken = tokenBlacklist.get(token);
  return !!blacklistedToken;
}

/**
 * Clean up expired tokens from blacklist
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, data] of tokenBlacklist.entries()) {
    if (now > data.expiresAt) {
      tokenBlacklist.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired blacklisted tokens`);
  }
}

// Clean up expired tokens every 30 minutes
setInterval(cleanupExpiredTokens, 30 * 60 * 1000);