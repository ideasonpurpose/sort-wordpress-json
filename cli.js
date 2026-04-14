#!/usr/bin/env node

// @ts-check
/// <reference path="./types.d.ts" />
/// <reference types="node" />

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "./package.json" with { type: "json" };

import { findThemeFiles } from "./lib/find-files.js";
import { processFile } from "./lib/process-file.js";

import { resolve } from "path";

import { writeFile } from "fs/promises";
import fg from "fast-glob";
import chalk from "chalk";

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

  const updatedFiles = filesToProcess
    .map((file) => resolve(file))
    .map((filepath) => processFile(filepath, argIndent));

  (await Promise.all(updatedFiles)).forEach((result) => {
    const relPath = result.file.replace(process.cwd(), "").replace(/^\/*/, "");
    if (result.status === "success") {
      writeOutput(result.fullPath, result.content, dryRun);
      console.log(chalk.green(`Successfully processed ${relPath}`));
    } else if (result.status === "skipped") {
      console.warn(chalk.yellow(`Skipped ${relPath}: ${result.reason}`));
      // } else if (result.status === "error") {
    } else {
      console.error(chalk.red(`Error processing ${relPath}: ${result.reason}`));
      console.error(chalk.red(result?.error?.stack));
    }
  });
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
if (import.meta.url === `file://${process.argv[1]}`) {
  yargs(hideBin(process.argv))
    .command(
      "$0 [file]",
      "Sort WordPress JSON files",
      (yargs) => {
        yargs
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
    .demandCommand(0)
    .help()
    .showHelpOnFail(false)
    .version(packageJson.version).argv;
}
/* v8 ignore stop */
