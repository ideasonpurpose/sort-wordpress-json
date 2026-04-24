// @ts-check

import { create, clearAll } from "flat-cache";
import envPaths from "env-paths";

const cacheId = "sort-wordpress-json";

const cacheDir = envPaths(cacheId).cache;
const cacheOptions = {
  cacheId,
  cacheDir,
  ttl: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
  lruSize: 50, // store up to 50 items
};

const cache = create(cacheOptions);

/**
 * Get a cached value by key
 * @param {string} key
 * @returns {any}
 */
export function cacheGet(key) {
  return cache.get(key);
}

/**
 * Set a cached value
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl]
 */
export function cacheSet(key, value, ttl) {
  cache.set(key, value, ttl);
  cache.save();
}

/**
 * Clear all cached data
 */
export function cacheClear() {
  clearAll(cacheDir);
}

// Check keys, but reject all false or null requests
export function cacheKeyExists(key) {
  if (!key) {
    return false;
  }
  return cache.keys().includes(key);
}

/**
 * @returns {Object}
 */
export function cacheList() {
  return {
    dir: cacheDir,
    keys: cache.keys(),
    items: cache.items,
    count: cache.keys().length,
  };
}
