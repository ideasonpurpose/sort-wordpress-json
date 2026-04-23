#!/usr/bin/env node

// @ts-check
/// <reference path="./types.d.ts" />
/// <reference types="node" />

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "./package.json" with { type: "json" };

import { formatDistanceToNow, addSeconds } from "date-fns";

import { findThemeFiles } from "./lib/find-files.js";
import { processFile } from "./lib/process-file.js";
import {
  cacheGet,
  cacheSet,
  cacheKeyExists,
  cacheList,
  cacheClear,
} from "./lib/cache.js";
import { cacheSchemas } from "./lib/cache-schemas.js";
import { coerceIndent } from "./lib/coerce-indent.js";

import { resolve, basename } from "path";

import { readFile, writeFile } from "fs/promises";
import { realpathSync } from "fs";
import { fileURLToPath } from "url";

import fg from "fast-glob";
import chalk from "chalk";
import ora from "ora";

import prettyMilliseconds from "pretty-ms";
// import { argv } from "process";

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
 * @param {import('./types.d.ts').CliArgs} argv
 */
export async function main(argv) {
  const startTime = process.hrtime.bigint();
  const {
    file: argFile,
    indent: argIndent,
    overrides: argOverrides,
    expansions: argExpansions,
    noDefaultOverrides,
    dryRun,
  } = argv;

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
    console.log(`Found ${filesToProcess.length} files to process:`);
  }

  const missingCacheKeys = new Set();
  const updatedFiles = [];

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
          suffixText: chalk.blue(prettyMilliseconds(endTime)),
        });
      }
    } catch (e) {
      // Ignore errors, will be handled in processFile
    }

    const relPath = filepath.replace(process.cwd(), "").replace(/^\/*/, "");
    const spinner = ora({
      text: relPath,
      spinner: "dots3",
    }).start();

    const result = await processFile(filepath, argIndent);
    if (result.status === "success") {
      spinner.succeed(
        relPath + " " + chalk.blue(prettyMilliseconds(result.duration)),
      );
    } else if (result.status === "skipped") {
      spinner.warn(relPath + " " + chalk.yellow(`Skipped: ${result.reason}`));
    } else {
      spinner.fail(relPath + " " + chalk.red(`Error: ${result.reason}`));
    }
    // updatedFiles.push(processFile(filepath, argIndent));
  }

  // (await Promise.all(updatedFiles)).forEach((result) => {
  //   const relPath = result.file.replace(process.cwd(), "").replace(/^\/*/, "");
  //   if (result.status === "success") {
  //     writeOutput(result.fullPath, result.content, dryRun); // adds about 1ms to the total time
  //     console.log(
  //       chalk.green("✔"),
  //       relPath,
  //       chalk.blue(prettyMilliseconds(result.duration)),
  //     );
  //   } else if (result.status === "skipped") {
  //     console.warn(
  //       chalk.yellow("⚠"),
  //       // chalk.yellow("↷"),
  //       relPath,
  //       chalk.yellow(`Skipped: ${result.reason}`),
  //     );
  //   } else {
  //     console.error(
  //       chalk.red("✖"),
  //       relPath,
  //       chalk.red(`Error: ${result.reason}`),
  //     );
  //     console.error(chalk.red(result?.error?.stack));
  //   }
  // });
  const endTime = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
  const itemLabel = filesToProcess.length === 1 ? "file" : "files";
  console.log(
    `sort-wp-json processed ${chalk.cyan(filesToProcess.length)} ${itemLabel} in ${chalk.cyan(prettyMilliseconds(endTime))}.`,
  );
}

/**
 * Coerces an indentation value into a standardized object format.
 * The ten character limit comes from JSON.stringify's maximum supported indentation.
 * @param {string|number} n - The indentation value to coerce. Accepts 'tabs', 'tab', or a number (0-10).
 * @returns {Object|false} An object with properties {amount: number, indent: string, type: string} for valid inputs, or false for invalid values.
 */
export function coerceIndent(n) {
  const strN = String(n);
  if (["tabs", "tab"].includes(strN)) {
    return { amount: 1, indent: "\t", type: "tab" };
  }
  // Numbers will be clamped from 0-10, or NaN
  let i = Math.min(Math.max(parseInt(strN, 10), 0), 10);
  if (!isNaN(i)) {
    return { amount: i, indent: "".padEnd(i, " "), type: "space" };
  }
  // 'inherit' and all non-numeric values return false
  return false;
}

/* v8 ignore start */
if (fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  yargs(hideBin(process.argv))
    .command(
      "$0 [file]",
      "Sort WordPress JSON files",
      (yargs) => {
        yargs
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
          // .option("cache-clear", {
          //   type: "boolean",
          //   describe: "Clear the schema cache",
          //   default: false,
          // })
          // .option("cache-reset", {
          //   type: "boolean",
          //   describe:
          //     "Reset the schema cache (Clear and download fresh copies)",
          //   default: false,
          // })
          // .option("cache-list", {
          //   type: "boolean",
          //   describe: "List the cached schema files",
          //   default: false,
          // })
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
                "Schema cache refreshed in " +
                  chalk.blue(prettyMilliseconds(endTotalTime)) +
                  ".",
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
