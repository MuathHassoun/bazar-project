// cache.js - In-memory cache for the frontend server
// Stores results of recent info/lookup queries
// Invalidated by backend replicas on any write (buy or catalog update)

const MAX_CACHE_SIZE = 100; // maximum number of items to store

// Internal store: Map of bookId -> { data, timestamp }
const cacheStore = new Map();

// Tracks insertion order for LRU eviction
const insertionOrder = [];

/**
 * Get a cached item by bookId.
 * Returns the cached data object, or null if not found.
 */
function get(bookId) {
  const key = String(bookId);
  if (cacheStore.has(key)) {
    console.log(`[Cache] HIT for book ${key}`);
    return cacheStore.get(key).data;
  }
  console.log(`[Cache] MISS for book ${key}`);
  return null;
}

/**
 * Store an item in the cache.
 * If cache is full, evicts the oldest entry (LRU).
 */
function set(bookId, data) {
  const key = String(bookId);

  // If key already exists, remove from order list (will re-add at end)
  if (cacheStore.has(key)) {
    const idx = insertionOrder.indexOf(key);
    if (idx !== -1) insertionOrder.splice(idx, 1);
  }

  // Evict oldest if at capacity
  if (cacheStore.size >= MAX_CACHE_SIZE && !cacheStore.has(key)) {
    const oldest = insertionOrder.shift();
    cacheStore.delete(oldest);
    console.log(`[Cache] Evicted book ${oldest} (LRU)`);
  }

  cacheStore.set(key, { data, timestamp: Date.now() });
  insertionOrder.push(key);
  console.log(`[Cache] SET for book ${key}`);
}

/**
 * Remove a specific item from the cache.
 * Called when a backend replica sends an invalidation request.
 */
function invalidate(bookId) {
  const key = String(bookId);
  if (cacheStore.has(key)) {
    cacheStore.delete(key);
    const idx = insertionOrder.indexOf(key);
    if (idx !== -1) insertionOrder.splice(idx, 1);
    console.log(`[Cache] INVALIDATED book ${key}`);
    return true;
  }
  console.log(
    `[Cache] Invalidate called for book ${key} (not in cache, skipping)`,
  );
  return false;
}

/**
 * Clear the entire cache.
 */
function clear() {
  cacheStore.clear();
  insertionOrder.length = 0;
  console.log("[Cache] Cleared all entries");
}

/**
 * Returns cache stats for debugging and performance measurements.
 */
function stats() {
  return {
    size: cacheStore.size,
    maxSize: MAX_CACHE_SIZE,
    keys: [...cacheStore.keys()],
  };
}

module.exports = { get, set, invalidate, clear, stats };
