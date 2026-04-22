// @ts-check

import { FlatCache, create, clearAll, clearCacheById } from "flat-cache";
import envPaths from "env-paths";
import path from "node:path";
import fs from "node:fs";

import chalk from "chalk";

const cacheId = "sort-wordpress-json";
// const paths = envPaths(cacheId);

const cacheDir = envPaths(cacheId).cache;
const cacheOptions = {
  cacheId,
  cacheDir,
  ttl: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
  lruSize: 50, // store up to 50 items
  // lruSize: 8, // store up to 50 items
};

const cache = create(cacheOptions);


cacheSet(
  "test " + new Date().getSeconds(),
  "This is a test value",
  Math.random() * 15 * 60 * 1000,
);

// cache.delete('https://schemas.wp.org/trunk/theme.json');

// console.log(cache.items);
// console.log(cache);
// const boo = cache.get("test 14");
// console.log(boo.key);
cache.save();

/**
 * Get a cached value by key
 * @param {string} key
 * @returns {any}
 */
export function cacheGet(key) {
  return cache.getKey(key);
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
  // clearCacheById(cacheId, cacheDir);
  clearAll(cacheDir);
}

// Check keys, but reject all false or null requests
export function cacheKeyExists(key) {
  if (!key) {
    return false;
  }
  // console.log({
  //   "!key": !key,
  //   found: cache.keys().includes(key),
  //   safeFound: !key || cache.keys().includes(key),
  // });
  return cache.keys().includes(key);
}

/**
 * @returns {Object}
 */
export function cacheList() {
  console.log('in cacheList')
  cache.delete("https://schemas.wp.org/trunk/theme.json"); // debug

  return {
    dir: cacheDir,
    keys: cache.keys(),
    items: cache.items,
    count: cache.keys().length,
  };
}

