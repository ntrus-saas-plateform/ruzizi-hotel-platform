/**
 * In-memory cache implementation with TTL support
 * Supports caching establishments, user permissions, and common queries
 * Optimized for high-performance data loading without Redis dependency
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxSize: number = 10000; // Maximum number of entries
  private cleanupIntervalMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), this.cleanupIntervalMs);

    console.log('In-memory cache initialized with max size:', this.maxSize);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Check if we need to evict entries due to size limit
    if (this.cache.size >= this.maxSize) {
      this.evictExpiredEntries();
      // If still at max size, remove oldest entries
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
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
   * Evict expired entries
   */
  private evictExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    // Simple LRU: remove 10% of entries
    const entriesToRemove = Math.ceil(this.cache.size * 0.1);
    const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);

    for (const key of keys) {
      this.cache.delete(key);
    }
  }

  /**
   * Get or set value (lazy loading)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Cache establishments data
   */
  async getEstablishments(): Promise<any[] | null> {
    return this.get<any[]>('establishments');
  }

  async setEstablishments(establishments: any[], ttlSeconds: number = 600): Promise<void> {
    await this.set('establishments', establishments, ttlSeconds);
  }

  /**
   * Cache user permissions
   */
  async getUserPermissions(userId: string): Promise<any | null> {
    return this.get<any>(`user_permissions:${userId}`);
  }

  async setUserPermissions(userId: string, permissions: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`user_permissions:${userId}`, permissions, ttlSeconds);
  }

  /**
   * Cache common queries
   */
  async getCommonQuery(queryKey: string): Promise<any | null> {
    return this.get<any>(`query:${queryKey}`);
  }

  async setCommonQuery(queryKey: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`query:${queryKey}`, data, ttlSeconds);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    this.evictExpiredEntries();
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    this.cache.forEach((entry) => {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    });

    return {
      connected: true,
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach((entry, key) => {
      // Rough estimation: key length + value JSON size + overhead
      totalSize += key.length * 2; // UTF-16 chars
      totalSize += JSON.stringify(entry).length * 2;
      totalSize += 100; // Object overhead
    });
    return totalSize;
  }

  /**
   * Destroy cache and cleanup
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.cache.clear();
    console.log('In-memory cache destroyed');
  }
}

// Singleton instance
export const cache = new InMemoryCache();

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
