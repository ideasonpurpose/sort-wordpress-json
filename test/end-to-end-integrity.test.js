import { expect, test } from "vitest";
import { schemaSort, resolveProps } from "../index.js";

import $RefParser from "@apidevtools/json-schema-ref-parser";

import { readdir, readFile, writeFile } from "node:fs/promises";

test.skip("Sorted JSON is equal to original JSON", async () => {
  const JSONfiles = (await readdir("./test/fixtures/sort")).filter(
    (f) => f.endsWith(".json") && !f.endsWith("-sorted.json")
  );

  // console.log(JSONfiles);
  // TODO: Compare input json file to processed output json file for deep equivalence
});
