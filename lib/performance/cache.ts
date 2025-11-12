/**
 * Simple in-memory cache implementation
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get or set value (lazy loading)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    this.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const cache = new Cache();

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttlSeconds: number = 300
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      return cache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttlSeconds
      );
    };

    return descriptor;
  };
}
