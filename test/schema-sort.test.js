import { readFile, writeFile } from "node:fs/promises";
import { expect, test, describe } from "vitest";

import { getSchema } from "../lib/get-schema.js";
import { schemaSort, walkSchema } from "../lib/schema-sort.js";

describe("schemaSort", async () => {
  const schema = await getSchema();

  test("Requires a schema", async () => {
    await expect(schemaSort({ some: "data" })).rejects.toThrow();
  });

  test("Recursion limit", () => {
    const path = "....x....x....x....x".split("");
    const schema = { properties: { key: {} } };
    expect(() => walkSchema(schema, {}, {}, path)).toThrowError(
      "We're in too deep!"
    );
  });

  test("sort bare theme.json", async () => {
    const src = await readFile(`./test/fixtures/sort/bare-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/bare-theme-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(`./tmp/bare-theme.json`, JSON.stringify(actual, null, 2));

    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort simple-theme.json", async () => {
    const src = await readFile(`./test/fixtures/sort/simple-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/simple-theme-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(`./tmp/simple-theme.json`, JSON.stringify(actual, null, 2));

    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort box-dimensions.json", async () => {
    const src = await readFile(`./test/fixtures/sort/box-dimensions.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/box-dimensions-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(
      `./tmp/box-dimensions.json`,
      JSON.stringify(actual, null, 2)
    );

    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort simple-3-levels.json", async () => {
    const src = await readFile(`./test/fixtures/sort/simple-3-levels.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/simple-3-levels-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(
      `./tmp/simple-3-levels.json`,
      JSON.stringify(actual, null, 2)
    );

    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  // NOTE: oneOf is not being handled, max is coming before min,
  //       opposite of what's in the schema.
  test("sort nested-array-theme.json", async () => {
    const src = await readFile(`./test/fixtures/sort/nested-array-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/nested-array-theme-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(
      `./tmp/nested-array-theme.json`,
      JSON.stringify(actual, null, 2)
    );
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort extra-stuff-at-the-end.json", async () => {
    const src = await readFile(
      `./test/fixtures/sort/extra-stuff-at-the-end.json`
    );
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/extra-stuff-at-the-end-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(
      `./tmp/extra-stuff-at-the-end.json`,
      JSON.stringify(actual, null, 2)
    );
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort sort-blocks-elements.json", async () => {
    const src = await readFile(
      `./test/fixtures/sort/sort-blocks-elements.json`
    );
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/sort-blocks-elements-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(
      `./tmp/sort-blocks-elements.json`,
      JSON.stringify(actual, null, 2)
    );
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test("sort units-array.json", async () => {
    const src = await readFile(`./test/fixtures/sort/units-array.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/units-array-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(`./tmp/units-array.json`, JSON.stringify(actual, null, 2));
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test.skip("sort iop-theme.json", async () => {
    const src = await readFile(`./test/fixtures/sort/iop-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/iop-theme-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(`./tmp/iop-theme.json`, JSON.stringify(actual, null, 2));
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test.skip("sort gwbs-theme.json", async () => {
    const src = await readFile(`./test/fixtures/sort/gwbs-theme.json`);
    const input = JSON.parse(src);

    const expected = JSON.parse(
      await readFile(`./test/fixtures/sort/gwbs-theme-sorted.json`)
    );

    const actual = await schemaSort(input, schema);

    await writeFile(`./tmp/gwbs-theme.json`, JSON.stringify(actual, null, 2));
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});
