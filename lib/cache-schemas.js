import $RefParser from "@apidevtools/json-schema-ref-parser";
import { cacheSet } from "./cache.js";

/**
 * Prime the cache with schemas
 * This outputs colored CLI output
 * @param {string | string[]} schemaUrls
 */
export async function cacheSchemas(schemaUrls) {
  const urls = Array.isArray(schemaUrls) ? schemaUrls : [schemaUrls];
  const result = [];

  for (const url of urls) {
    const startTime = process.hrtime.bigint();
    try {
      const bundled = await $RefParser.bundle(url);
      cacheSet(url, bundled);
      const endTime = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
      result.push({ key: url, duration: endTime });
    } catch (error) {
      console.error(`Failed to cache ${url}:`, error.message);
    }
  }
  return result;
}
