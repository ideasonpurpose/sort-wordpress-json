// @ts-check

import { readFile } from "fs/promises";
import { basename } from "path";

import detectIndent from "detect-indent";

import { getSchema } from "./get-schema.js";
import { schemaSort } from "./schema-sort.js";
import { formatWPJson } from "./format-wp-json.js";
import { validateJson } from "./validate-json.js";
import { schemaMap } from "./schemas.js";

/**
 * Process and format a single JSON file.
 * @param {string} fullPath
 * @param {import("../types").Indent | false} [indent]
 * @returns {Promise<import("../types").ProcessResult>}
 */
export async function processFile(fullPath, indent) {
  try {
    const startTime = process.hrtime.bigint();
    const rawFile = (await readFile(fullPath, "utf8")).toString();
    const newIndent = indent || detectIndent(rawFile);
    const originalJson = JSON.parse(rawFile);

    let schemaUrl = originalJson["$schema"] || schemaMap[basename(fullPath)];
    if (!schemaUrl) {
      return { file: fullPath, status: "skipped", reason: "no schema" };
    }

    const schema = await getSchema(schemaUrl);

    if (!schema) {
      return {
        file: fullPath,
        status: "skipped",
        reason: "unable to load schema",
      };
    }

    const sortedJson = await schemaSort(originalJson, schema);
    const formatted = await formatWPJson(sortedJson, newIndent);
    validateJson(originalJson, formatted);

    return {
      file: fullPath,
      status: "success",
      content: formatted,
      fullPath,
      duration: Number(process.hrtime.bigint() - startTime) / 1_000_000, // Convert nanoseconds to milliseconds
    };
  } catch (error) {
    return { file: fullPath, status: "error", reason: error.message, error };
  }
}
