/**
 * High-performance, zero-dependency in-memory TTL & LRU cache
 * Optimizes server response times by caching auth checks, session validation,
 * and static reference data (e.g. hostels roster).
 */
class MemoryCache {
  constructor(defaultTTLSeconds = 120, maxItems = 1500) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.maxItems = maxItems;
  }

  /**
   * Retrieves an item from cache if present and not expired
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Stores an item with optional custom TTL in seconds
   */
  set(key, value, ttlSeconds) {
    // If cache is at maximum capacity, evict the oldest entry (LRU behavior)
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Deletes a specific key
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Purges all keys starting with a prefix (e.g. all sessions for a user `auth:usr_123`)
   */
  delPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache
   */
  flush() {
    this.cache.clear();
  }

  /**
   * Returns current cache metrics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
    };
  }
}

export const appCache = new MemoryCache();
export default appCache;
