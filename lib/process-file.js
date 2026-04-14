// @ts-check

import { readFile } from "fs/promises";
import { resolve } from "path";

import detectIndent from "detect-indent";

import { getSchema } from "./get-schema.js";
import { schemaSort } from "./schema-sort.js";
import { formatWPJson } from "./format-wp-json.js";
import { validateJson } from "./validate-json.js";

/**
 * Process and format a single JSON file.
 * @param {string} fullPath
 * @param {import("../types").Indent | false} indent
 */
export async function processFile(fullPath, indent) {
  try {
    const rawFile = (await readFile(fullPath, "utf8")).toString();
    const newIndent = indent || detectIndent(rawFile);
    const originalJson = JSON.parse(rawFile);
    const schema = await getSchema(originalJson, fullPath);

    if (!schema) {
      return { file: fullPath, status: "skipped", reason: "no schema" };
    }

    const sortedJson = await schemaSort(originalJson, schema);
    const formatted = await formatWPJson(sortedJson, newIndent);
    validateJson(originalJson, formatted);

    return { file: fullPath, status: "success", content: formatted, fullPath };
  } catch (error) {
    return { file: fullPath, status: "error", reason: error.message, error };
  }
}
