import { expect, test, describe, vi } from "vitest";
import { schemaSort } from "../lib/schema-sort.js";
import { getSchema } from "../lib/get-schema.js";

import { readdir, readFile } from "node:fs/promises";

describe("Sorted JSON equals original JSON", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const jsonFiles = (await readdir("./test/fixtures/sort")).filter(
    (f) => f.endsWith(".json") && !f.endsWith("-sorted.json"),
  );

  test.each(jsonFiles)("jsonFile: %s", async (jsonFile) => {
    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/${jsonFile}`),
    );
    const schema = await getSchema(expected, "theme.json");

    const actual = await schemaSort(expected, schema);
    expect(actual).toEqual(expected);
  });
});
