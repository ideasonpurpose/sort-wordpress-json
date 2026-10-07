#!/usr/bin/env node

// @ts-check
/// <reference path="./types.d.ts" />
/// <reference types="node" />

import chalk from "chalk";
import { formatDistanceToNow } from "date-fns";
import fg from "fast-glob";
import { realpathSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import ora from "ora";
import { resolve } from "path";
import prettyMilliseconds from "pretty-ms";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { expansions as defaultExpansions } from "./defaults/expansions.js";
import { overrides as defaultOverrides } from "./defaults/overrides.js";
import { schemaUrls } from "./defaults/schemas.js";
import { cacheClear, cacheKeyExists, cacheList } from "./lib/cache.js";
import { cacheSchemas } from "./lib/cache-schemas.js";
import { coerceIndent } from "./lib/coerce-indent.js";
import { findThemeFiles } from "./lib/find-files.js";
import { processFile, processJson } from "./lib/process-file.js";
import packageJson from "./package.json" with { type: "json" };

/**
 * Writes the formatted JSON content to the specified file path.
 *
 * @param {string} fullPath - The absolute path to the file.
 * @param {string} formatted - The formatted JSON string.
 * @param {boolean} dryRun - If true, logs the output instead of writing it.
 * @returns {Promise<void>}
 */
export async function writeOutput(fullPath, formatted, dryRun) {
	if (dryRun) {
		if (process.stdout.isTTY) {
			console.log(`Dry run: would write to ${fullPath}`);
		}
		console.log(formatted);
	} else {
		await writeFile(fullPath, formatted);
	}
}

/**
 * Returns the appropriate chalk color function based on duration.
 * @param {number} ms - The duration in milliseconds.
 * @returns {import('chalk').Chalk}
 */
function getColorForMs(ms) {
	if (ms < 300) return chalk.green;
	if (ms < 1000) return chalk.yellow;
	return chalk.red;
}

/**
 * Formats a millisecond value into a human-readable string with color coding.
 *
 * - Green for fast (< 300ms)
 * - Yellow for moderate (< 1000ms)
 * - Red for slow (≥ 1000ms)
 *
 * Non-numeric parts (units like "ms", "s", etc.) are dimmed.
 *
 * @param {number} milliseconds - The duration in milliseconds.
 * @returns {string} The formatted and colored string.
 */
function prettyLogMs(milliseconds) {
	const pretty = prettyMilliseconds(milliseconds);
	const dimmed = pretty.replace(/([^\d.]+)/g, chalk.dim("$1"));
	const colorFn = getColorForMs(milliseconds);
	return colorFn(dimmed);
}

/**
 * Reads all of STDIN and returns it as a UTF-8 string.
 * @returns {Promise<string>}
 */
async function readStdin() {
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	return Buffer.concat(chunks).toString("utf8");
}

/**
 * @param {import('./types.d.ts').CliArgs} argv
 */
export async function main(argv) {
	const startTime = process.hrtime.bigint();
	const {
		file: argFile,
		indent,
		overrides: argOverrides = [],
		expansions: argExpansions = [],
		noDefaultOverrides,
		dryRun,
	} = argv;

	if (!argFile && !process.stdin.isTTY) {
		const rawInput = await readStdin();
		const result = await processJson(rawInput, "stdin", {
			indent,
			overrides: noDefaultOverrides
				? argOverrides
				: [...defaultOverrides, ...argOverrides],
			expansions: [...defaultExpansions, ...argExpansions],
		});

		if (result.status === "success") {
			process.stdout.write(result.content);
			console.error(
				`${chalk.bold("sort-wp-json")} sorted STDIN in ${prettyLogMs(result.duration)}.`,
			);
		} else {
			console.error(chalk.red(`Error: ${result.reason}`));
			process.exitCode = 1;
		}
		return;
	}

	let filesToProcess = [];
	if (argFile) {
		filesToProcess = await fg(argFile);
		if (filesToProcess.length === 0) {
			console.error(`No files found matching pattern: ${argFile}`);
			return;
		}
	} else {
		filesToProcess = await findThemeFiles(process.cwd());
		if (!filesToProcess.includes("theme.json")) {
			console.error("No theme.json file found.");
			return;
		}
		console.log(
			`${chalk.bold("sort-wp-json")} found ${chalk.yellow(filesToProcess.length)} files:`,
		);
	}

	const missingCacheKeys = new Set();

	const overrides = noDefaultOverrides
		? argOverrides
		: [...defaultOverrides, ...argOverrides];
	const expansions = [...defaultExpansions, ...argExpansions];

	for (const file of filesToProcess) {
		const filepath = resolve(file);
		try {
			const startTime = process.hrtime.bigint();
			const rawFile = (await readFile(filepath, "utf8")).toString();
			const originalJson = JSON.parse(rawFile);
			const schemaUrl = originalJson["$schema"];
			if (!missingCacheKeys.has(schemaUrl) && !cacheKeyExists(schemaUrl)) {
				const spinner = ora({
					text: chalk.gray(`Caching ${chalk.bold(schemaUrl)}...`),
					color: "gray",
					spinner: "growVertical",
				}).start();

				missingCacheKeys.add(schemaUrl);
				await cacheSchemas(schemaUrl);

				const endTime = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
				spinner.stopAndPersist({
					symbol: chalk.gray("●"),
					text: chalk.gray(`Cached ${chalk.bold(schemaUrl)}`),
					suffixText: prettyLogMs(endTime),
				});
			}
		} catch (e) {} // Ignore errors, will be handled in processFile

		const relPath = filepath.replace(process.cwd(), "").replace(/^\/*/, ""); // ironically, this is usually just pre-resolved `file`
		const spinner = ora({
			text: relPath,
			spinner: "dots3",
		}).start();

		const result = await processFile(filepath, {
			indent,
			overrides,
			expansions,
		});

		if (result.status === "success") {
			writeOutput(result.fullPath, result.content, dryRun);
			// const ms = prettyMilliseconds(result.duration);
			spinner.succeed(relPath + " " + prettyLogMs(result.duration));
		} else if (result.status === "skipped") {
			spinner.warn(relPath + " " + chalk.yellow(`Skipped: ${result.reason}`));
		} else {
			spinner.fail(relPath + " " + chalk.red(`Error: ${result.reason}`));
		}
	}

	const endTime = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
	const itemLabel = filesToProcess.length === 1 ? "file" : "files";
	console.log(
		`${chalk.bold("sort-wp-json")} processed ${chalk.yellow(filesToProcess.length)} ${itemLabel} in ${prettyLogMs(endTime)}.`,
	);
}

/* v8 ignore start */
if (fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
	// VS Code runs this with its Electron binary and ELECTRON_RUN_AS_NODE=1.
	// yargs hideBin then keeps the script path as the [file] positional.
	const userArgv = process.env.ELECTRON_RUN_AS_NODE
		? process.argv.slice(2)
		: hideBin(process.argv);
	yargs(userArgv)
		.command(
			"$0 [file]",
			"Sort WordPress JSON files. With no file argument and piped STDIN, reads JSON from STDIN and writes sorted JSON to STDOUT.",
			(yargs) => {
				yargs
					.parserConfiguration({
						"combine-arrays": true,
					})
					.pkgConf("sort-wp-json")
					.positional("file", {
						type: "string",
						normalize: true,
						required: false,
						describe: "File path or glob pattern",
					})
					.option("indent", {
						type: "string",
						alias: "t",
						describe:
							"Set indent to some number of spaces. 0 returns a condensed file. " +
							"Indentation will be clamped between 0-10. " +
							"Out of deference to WordPress conventions, output files will be " +
							"indented with tabs by default or if no number is provided. " +
							"Also accepts 'tab', 'tabs' and 'inherit' (default)",
						default: "inherit",
						coerce: coerceIndent,
					})
					.option("overrides", {
						type: "array",
						describe:
							"A list of override keys like 'settings.color.custom' to force to the top. Force nodes to the bottom by prefixing their paths with an exclamation point like '!settings.color.duotone'",
						default: [],
					})
					.option("no-overrides", {
						type: "boolean",
						describe:
							"Disable overrides. Use with --overrides to specify only custom overrides",
						default: false,
					})
					.option("expansions", {
						type: "array",
						describe:
							"A list of expansion keys like 'settings.typography.fontSizes'. Collapse nodes by prefixing with an exclamation point like '!settings.color.palette'",
						default: [],
					})
					.option("dry-run", {
						alias: "n",
						type: "boolean",
						describe: "Perform a dry run without writing changes",
						default: false,
					});
			},
			async (argv) => {
				return await main(/** @type {import('./types.d.ts').CliArgs} */ (argv));
			},
		)
		.command(
			"cache <subcommand>",
			"Manage the schema cache: clear, refresh, or list cached files.",
			(yargs) => {
				yargs
					.command(
						"clear",
						"Clear the cached schema files",
						{},
						async (argv) => {
							cacheClear();
							console.log("Schema cache cleared.");
						},
					)
					.command(
						"refresh",
						"Refresh and rebuild the schema cache",
						{},
						async (argv) => {
							console.log("Refreshing schema cache...");
							const startTotalTime = process.hrtime.bigint();

							for (const schema of schemaUrls) {
								const startTime = process.hrtime.bigint();
								const spinner = ora({
									text: chalk.gray(`Caching ${chalk.bold(schema)}...`),
									color: "gray",
									spinner: "growVertical",
								}).start();

								await cacheSchemas(schema);

								const endTime =
									Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
								spinner.stopAndPersist({
									symbol: chalk.gray("●"),
									text: chalk.gray(`Cached ${chalk.bold(schema)}`),
									suffixText: chalk.blue(prettyMilliseconds(endTime)),
								});
							}
							const endTotalTime =
								Number(process.hrtime.bigint() - startTotalTime) / 1_000_000; // Convert nanoseconds to milliseconds
							console.log(
								`Schema cache refreshed in ${chalk.blue(prettyMilliseconds(endTotalTime))}.`,
							);
						},
					)
					.command("list", "List the cached schema files", {}, (argv) => {
						const info = cacheList();
						const items = info.items
							.sort((a, b) => {
								if (!!a.expires != !!b.expires) {
									return a.expires ? -1 : 1;
								}
								return a.expires
									? a.expires - b.expires
									: a.key.localeCompare(b.key);
							})
							.map(
								(item) =>
									item.key +
									" " +
									(item.expires
										? chalk.blue(formatDistanceToNow(new Date(item.expires)))
										: ""),
							);
						console.log("Schema Key", chalk.blue("expiration"));
						console.log(items.join("\n"));
						const itemLabel = info.count === 1 ? "file" : "files";
						console.log(
							`Schema Cache contains ${chalk.cyan(info.count)} ${itemLabel}.`,
						);
						console.log(`Cache directory: ${chalk.green(info.dir)}`);
					})
					.demandCommand(
						1,
						"You must specify a subcommand: clear, refresh, or list",
					);
			},
		)
		.demandCommand(0)
		.help()
		.showHelpOnFail(false)
		.version(packageJson.version).argv;
}
/* v8 ignore stop */
