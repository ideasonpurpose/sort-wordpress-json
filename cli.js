#!/usr/bin/env node

// @ts-check

// TODO: Offer an indent option which accepts a number. If this appears,
//       JSON will be indented with spaces. Out of deference to WordPress
//       conventions, the default formatting for output files uses tabs.

// import { globbySync } from 'globby'
// import fs from 'node:fs'
// import sortThemeJson from './index.js'

import { getSchema } from "./lib/get-schema.js";
import { schemaSort } from "./lib/schema-sort.js";
import { formatWPJson } from "./lib/format-wp-json.js";

import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, resolve  } from "path";

import detectIndent from "detect-indent";
import isEqual from "lodash.isequal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const filePath = process.argv[2];

  // const fullPath = join(__dirname, filePath);
  const fullPath = resolve(filePath)

  console.log(process.argv, fullPath);

  const rawFile = await readFile(fullPath, "utf8");
  const indent = detectIndent(rawFile.toString());
  const jsonData = JSON.parse(rawFile.toString());
  const schema = await getSchema(jsonData);

  const sorted = await schemaSort(jsonData, schema);

  if (isEqual(jsonData, sorted)) {
    await writeFile(fullPath, await formatWPJson(sorted, indent));
  } else {
    throw new Error(
      "Something went wrong, input and output files are not equivalent"
    );
  }
}

await main();
