#!/usr/bin/env node

// @ts-check
/// <reference path="./types.d.ts" />
/// <reference types="node" />

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "./package.json" with { type: "json" };

import { getSchema } from "./lib/get-schema.js";
import { schemaSort } from "./lib/schema-sort.js";
import { formatWPJson } from "./lib/format-wp-json.js";
import { validateJsonData } from "./lib/validateJsonData.js";

import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

import detectIndent from "detect-indent";

/**
 * @param {import('./types.d.ts').CliArgs} argv
 */
export async function main(argv) {
  const {
    file: argFile,
    indent: argIndent,
    schema: argSchema,
    overrides: argOverrides = [],
    noDefaultOverrides,
    dryRun,
  } = argv;
  if (!argFile) {
    throw new Error("No input file provided");
  }

  try {
    const fullPath = resolve(argFile);

    // Check if file exists
    // const fs = await import("fs");
    // if (!fs.existsSync(fullPath)) {
    //   throw new Error(`Input file does not exist: ${fullPath}`);
    // }

    const rawFile = (await readFile(fullPath, "utf8")).toString();
    const newIndent = argIndent || detectIndent(rawFile);

    const originalJson = JSON.parse(rawFile); // Throws if invalid JSON
    // const schema = await getSchema(originalJson, schemaUrl); // Pass optional schemaUrl
    const _schema = await getSchema(originalJson); // Pass optional schemaUrl
    // const effectiveOverrides = noDefaultOverrides ? [] : overrides; // Handle no-default-overrides
    // const sortedJson = await schemaSort(originalJson, schema, effectiveOverrides);
    const sortedJson = await schemaSort(originalJson, _schema);
    const validated = validateJsonData(originalJson, sortedJson);

    const formatted = await formatWPJson(validated, newIndent);
    if (dryRun) {
      // console.log(`Dry run: would write to ${fullPath}`);
      console.log(formatted);
    } else {
      await writeFile(fullPath, formatted);
      console.log(`Successfully sorted and formatted: ${fullPath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    throw error; // Re-throw for CLI handling
  }
}

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
            required: true,
            describe: "File path or glob pattern",
          })
          .option("schema", {
            type: "string",
            describe:
              "Specify a schema, will override any $schema properties in the files",
            default: false,
          })
          .option("indent", {
            type: "string",
            describe:
              "Set indent to some number of spaces. 0 returns a condensed file. " +
              "Indentation will be clamped between 0-16. " +
              "Out of deference to WordPress conventions, output files will be " +
              "indented with tabs by default or if no number is provided. " +
              "Also accepts 'tab', 'tabs' and 'inherit' (default)",
            default: "inherit",
            coerce: (n) => {
              if (["tabs", "tab"].includes(n)) {
                return { amount: 1, indent: "\t", type: "tab" };
              }
              // Numbers will be clamped from 0-16, or NaN
              let i = Math.min(Math.max(parseInt(n, 10), 0), 16);
              if (!isNaN(i)) {
                return { amount: i, indent: "".padEnd(i, " "), type: "space" };
              }
              // 'inherit' and all non-numeric values return false
              return false;
            },
          })
          .option("no-default-overrides", {
            type: "boolean",
            describe: "Disable default overrides",
            default: false,
          })
          .option("overrides", {
            type: "array",
            describe: "A list of override keys like settings.color.custom",
            default: false,
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
    .help()
    .version(packageJson.version)
    .updateStrings({
      "Positionals:": "Input File/glob:",
    }).argv;
}
