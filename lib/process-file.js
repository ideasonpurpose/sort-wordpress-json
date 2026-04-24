// @ts-check

import { readFile } from "fs/promises";
import { basename } from "path";

import detectIndent from "detect-indent";

import { getSchema } from "./get-schema.js";
import { schemaSort } from "./schema-sort.js";
import { formatWPJson } from "./format-wp-json.js";
import { validateJson } from "./validate-json.js";
import { schemaMap } from "../defaults/schemas.js";

/**
 * Process and format a single JSON file.
 * @param {string} fullPath
 * @param {Object} [options={}] - Options object
 * @param {import("../types").Indent | false} [options.indent]
 * @param {string[]} [options.overrides=[]] - A list of override keys like 'settings.color.custom' to force to the top. Force nodes to the bottom by prefixing their paths with an exclamation point like '!settings.color.duotone'.
 * @param {string[]} [options.expansions=[]] - A list of expansion keys like 'settings.typography.fontSizes'. Collapse nodes by prefixing with an exclamation point like '!settings.color.palette'.
 * @returns {Promise<import("../types").ProcessResult>}
 */
export async function processFile(fullPath, options = {}) {
  const { indent, overrides = [], expansions = [] } = options;
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

    const sortedJson = await schemaSort(originalJson, schema, overrides);
    const formatted = await formatWPJson(sortedJson, newIndent, expansions);
    validateJson(originalJson, formatted);

    // console.log(Number(process.hrtime.bigint() - startTime) / 1_000_000);

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
