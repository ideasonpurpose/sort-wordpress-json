#!/usr/bin/env node

// @ts-check

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "./package.json" with { type: "json" };

import { getSchema } from "./lib/get-schema.js";
import { schemaSort } from "./lib/schema-sort.js";
import { formatWPJson } from "./lib/format-wp-json.js";

import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

import detectIndent from "detect-indent";
import isEqual from "lodash.isequal";

/**
 * @typedef {Object} IndentOption
 * @property {number} amount
 * @property {string} indent
 * @property {string} type
 */

/**
 * @typedef {Object} CliArgs
 * @property {string} [file]
 * @property {string} [schema]
 * @property {IndentOption|false} [indent]
 * @property {boolean} [noDefaultOverrides]
 * @property {string[]} [overrides]
 */

/**
 * @param {CliArgs} argv
 */
export async function main(argv) {
  const { file, indent } = argv;
  if (!file) {
    throw new Error("No input file provided");
  }
  const fullPath = resolve(file);
  const rawFile = (await readFile(fullPath, "utf8")).toString();

  const newIndent = indent || detectIndent(rawFile);
  const jsonData = JSON.parse(rawFile);
  const schema = await getSchema(jsonData);

  const sorted = await schemaSort(jsonData, schema);

  // TODO: This should be built into the library. If the result is not equal, throw an error.
  if (isEqual(jsonData, sorted)) {
    await writeFile(fullPath, await formatWPJson(sorted, newIndent));
  } else {
    throw new Error(
      "Something went wrong, input and output files are not equivalent",
    );
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
              "Set indent to some number of spaces. 0 returns a condensed file. Indentation will clamped between 0-16." +
              "Out of deference to WordPress conventions, output files will be " +
              "indented with tabs by default or if no number is provided." +
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
            describe: "Shout the greeting in uppercase",
            default: false,
          })
          .option("overrides", {
            type: "array",
            describe: "A list of override keys like settings.color.custom",
            default: false,
          });
      },
      async (argv) => {
        return await main(/** @type {CliArgs} */ (argv));
      },
    )
    .help()
    .version(packageJson.version)
    .updateStrings({
      "Positionals:": "Input File/glob:",
    }).argv;
}
