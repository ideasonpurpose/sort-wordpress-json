import { expect, test, describe } from "vitest";
import { schemaSort } from "../lib/schema-sort.js";
// import { getSchema } from "../lib/get-schema.js";

import { readdir, readFile } from "node:fs/promises";

describe("Overrides", async () => {
  test("empty schema", async () => {
    const src = await readFile(`./test/fixtures/overrides/simple-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/overrides/simple-theme-override.json`)
    );

    const schema = {};
    const overrides = ["settings.layout", "settings.color.custom"];

    const actual = await schemaSort(input, schema, overrides);

    console.log({actual, expected});
    // const actual = await schemaSort(expected, schema);
    expect(actual).toHaveProperty("settings.color.custom");
    expect (actual).toStrictEqual(expected)
  });
});
