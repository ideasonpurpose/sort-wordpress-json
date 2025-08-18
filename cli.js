#!/usr/bin/env node

// @ts-check

// TODO: Offer an indent option which accepts a number. If this appears,
//       JSON will be indented with spaces. Out of deference to WordPress
//       conventions, the default formatting for output files should use tabs.

// import { globbySync } from 'globby'

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "./package.json" with { type: "json" };

import { getSchema } from "./lib/get-schema.js";
import { schemaSort } from "./lib/schema-sort.js";
import { formatWPJson } from "./lib/format-wp-json.js";

import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

import detectIndent from "detect-indent";
import isEqual from "lodash.isequal";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

async function main(fullPath) {
  const rawFile = (await readFile(fullPath, "utf8")).toString();
  const indent = detectIndent(rawFile);
  const jsonData = JSON.parse(rawFile);
  const schema = await getSchema(jsonData);

  const sorted = await schemaSort(jsonData, schema);

  // TODO: This should be built into the library. If the result is not equal, throw an error.
  if (isEqual(jsonData, sorted)) {
    await writeFile(fullPath, await formatWPJson(sorted, indent));
  } else {
    throw new Error(
      "Something went wrong, input and output files are not equivalent"
    );
  }
}

//   const fullPath = resolve(process.argv[2]);
// await main(fullPath);

yargs(hideBin(process.argv))
  .command(
    "$0 [file]",
    "Sort WordPress JSON files",
    (yargs) => {
      yargs
        .positional("file", {
          type: "string",
          array: true,
          normalize: true,
          describe: "One or more file paths or glob pattern",
        })
        .option("schema", {
          type: "string",
          describe:
            "Specify a schema, will override any $schema properties in the files",
          default: false,
        })
        .option("indent", {
          type: "number",
          describe:
            "Set indent to some number of spaces. 0 returns a condensed file. " +
            "Out of deference to WordPress conventions, output files will be " +
            "indented with tabs if no number is provided.",
          default: false,
          // TODO: Accept either a number or the strings "default" or "inherit"
          coerce: (n) =>
            n
              ? { amount: n, indent: "".padEnd(n, " "), type: "space" }
              : { amount: 1, indent: "\t", type: "tab" },
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
      const fullPath = resolve(argv.file);
      console.log({argv, fullPath});
      // console.log(argv.file, resolve(argv.file));
      await main(fullPath);
      // const greeting = `Hello, ${argv.name}!`;
      // console.log(argv.shout ? greeting.toUpperCase() : greeting);
    }
  )
  .help()
  .version(packageJson.version)
  .updateStrings({
    "Positionals:": "Input File/glob:",
  }).argv;
