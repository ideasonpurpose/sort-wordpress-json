// @ts-check

import detectIndent from "detect-indent";
import { readFile } from "fs/promises";
import { basename } from "path";
import { schemaMap } from "../defaults/schemas.js";
import { formatWPJson } from "./format-wp-json.js";
import { getSchema } from "./get-schema.js";
import { schemaSort } from "./schema-sort.js";
import { validateJson } from "./validate-json.js";

/**
 * Process and format a raw JSON string.
 * @param {string} rawFile - The raw JSON content to process.
 * @param {string} fullPath - Path used for schema detection and reporting.
 * @param {Object} [options={}] - Options object
 * @param {import("../types").Indent | false} [options.indent]
 * @param {string[]} [options.overrides=[]] - A list of override keys like 'settings.color.custom' to force to the top. Force nodes to the bottom by prefixing their paths with an exclamation point like '!settings.color.duotone'.
 * @param {string[]} [options.expansions=[]] - A list of expansion keys like 'settings.typography.fontSizes'. Collapse nodes by prefixing with an exclamation point like '!settings.color.palette'.
 * @returns {Promise<import("../types").ProcessResult>}
 */
export async function processJson(rawFile, fullPath, options = {}) {
	const { indent, overrides = [], expansions = [] } = options;
	try {
		const startTime = process.hrtime.bigint();
		const newIndent = indent || detectIndent(rawFile);
		const originalJson = JSON.parse(rawFile);

		const schemaUrl = originalJson["$schema"] || schemaMap[basename(fullPath)];
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

/**
 * Read then process a single JSON file.
 * @param {string} fullPath
 * @param {Object} [options={}] - Options object
 * @param {import("../types").Indent | false} [options.indent]
 * @param {string[]} [options.overrides=[]] - A list of override keys like 'settings.color.custom' to force to the top. Force nodes to the bottom by prefixing their paths with an exclamation point like '!settings.color.duotone'.
 * @param {string[]} [options.expansions=[]] - A list of expansion keys like 'settings.typography.fontSizes'. Collapse nodes by prefixing with an exclamation point like '!settings.color.palette'.
 * @returns {Promise<import("../types").ProcessResult>}
 */
export async function processFile(fullPath, options = {}) {
	try {
		const rawFile = (await readFile(fullPath, "utf8")).toString();
		return await processJson(rawFile, fullPath, options);
	} catch (error) {
		return { file: fullPath, status: "error", reason: error.message, error };
	}
}
