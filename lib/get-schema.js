// @ts-check

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { cacheGet, cacheSet } from "./cache.js";

/**
 * @param {string} schemaUrl
 * NOTE: json-schema-ref-parser handles loading from a url or filepath
 */
export async function getSchema(schemaUrl) {
  if (!schemaUrl) {
    return false;
  }

  const cached = cacheGet(schemaUrl);
  if (cached) {
    return await $RefParser.dereference(cached);
  }

  try {
    const bundled = await $RefParser.bundle(schemaUrl);
    cacheSet(schemaUrl, bundled);
    return await $RefParser.dereference(bundled);
  } catch (error) {
    console.error("Unable to load remote schema file.");
    return false;
  }
}
