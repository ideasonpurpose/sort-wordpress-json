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
};

const cache = create(cacheOptions);

cacheSet(
  "test " + new Date().getSeconds(),
  "This is a test value",
  // Math.random() * 15 * 60 * 1000,
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
 */
export function cacheSet(key, value) {
  cache.set(key, value);
  cache.save();
  // console.log(chalk.gray(`Caching "${key}"`)); // TODO: Not great here, log this some other way
}

/**
 * Clear all cached data
 */
export function cacheClear() {
  // clearCacheById(cacheId, cacheDir);
  clearAll(cacheDir);
}

/**
 * @returns {Object}
 */
export function cacheList() {
  cache.delete('https://schemas.wp.org/trunk/theme.json');

  return {
    dir: cacheDir,
    keys: cache.keys(),
    items: cache.items,
    count: cache.keys().length,
  };
}

/**
 * Prime the cache with schemas
 * This outputs colored CLI output
 * @param {string | string[]} schemaUrls
 */
export async function cacheSchemas(schemaUrls) {
  const $RefParser = (await import("@apidevtools/json-schema-ref-parser"))
    .default;

  const urls = Array.isArray(schemaUrls) ? schemaUrls : [schemaUrls];

  for (const url of urls) {
    const startTime = process.hrtime.bigint();
    try {
      const bundled = await $RefParser.bundle(url);
      cacheSet(url, bundled);
      const endTime = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
      // console.log(`Successfully cached ${url} in ${chalk.cyan(prettyMilliseconds(endTime))}`);
      return { key: url, duration: endTime };
    } catch (error) {
      console.error(`Failed to cache ${url}:`, error.message);
    }
  }
}
