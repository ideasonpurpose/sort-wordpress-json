// @ts-check

import { readFile } from "fs/promises";

import detectIndent from "detect-indent";

import { getSchema } from "./get-schema.js";
import { schemaSort } from "./schema-sort.js";
import { formatWPJson } from "./format-wp-json.js";
import { validateJson } from "./validate-json.js";
import prettyMilliseconds from "pretty-ms";

/**
 * Process and format a single JSON file.
 * @param {string} fullPath
 * @param {import("../types").Indent | false} [indent]
 */
export async function processFile(fullPath, indent) {
  try {
    const startTime = process.hrtime.bigint();
    const rawFile = (await readFile(fullPath, "utf8")).toString();
    const newIndent = indent || detectIndent(rawFile);
    const originalJson = JSON.parse(rawFile);

    let schema;
    let schemaTime;
    try {
      // getSchema is a giant speed bottleneck
      const schemaStartTime = process.hrtime.bigint();
      schema = await getSchema(originalJson, fullPath);
      schemaTime =
        Number(process.hrtime.bigint() - schemaStartTime) / 1_000_000;
    } catch (error) {
      return {
        file: fullPath,
        status: "skipped",
        reason: error.message,
        error,
      };
    }

    if (!schema) {
      return { file: fullPath, status: "skipped", reason: "no schema" };
    }

    const sortStartTime = process.hrtime.bigint();
    const sortedJson = await schemaSort(originalJson, schema);
    const formatted = await formatWPJson(sortedJson, newIndent);
    validateJson(originalJson, formatted);
    const sortTime =
      Number(process.hrtime.bigint() - sortStartTime) / 1_000_000;
    console.log({
      "Schema time": (schemaTime),
      "Sort time": (sortTime),
    });

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
