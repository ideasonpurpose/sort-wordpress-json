import { expect, test } from "vitest";
import { formatWPJson } from "../lib/format-wp-json.js";

import { readFile } from "node:fs/promises";

const fixturesPath = "test/fixtures/format";

test("Format WP JSON collapses color arrays", async () => {
  const src = JSON.parse(
    (await readFile(`${fixturesPath}/palette-theme.json`)).toString()
  );
  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted.json`)
  ).toString();

  const actual = await formatWPJson(src);

  expect(actual).toEqual(expected);
});

test("Format WP JSON 0 spaces", async () => {
  const src = JSON.parse(
    (await readFile(`${fixturesPath}/palette-theme.json`)).toString()
  );
  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted-0spaces.json`)
  ).toString();

  const actual = await formatWPJson(src, 0);

  expect(actual).toEqual(expected);
});

test("Format WP JSON 2 spaces", async () => {
  const src = JSON.parse(
    (await readFile(`${fixturesPath}/palette-theme.json`)).toString()
  );
  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted-2spaces.json`)
  ).toString();

  const actual = await formatWPJson(src, 2);

  expect(actual).toEqual(expected);
});

test("Format WP JSON 4 spaces", async () => {
  const src = JSON.parse(
    (await readFile(`${fixturesPath}/palette-theme.json`)).toString()
  );
  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted-4spaces.json`)
  ).toString();

  const actual = await formatWPJson(src, 4);

  expect(actual).toEqual(expected);
});

test("Condense font-sizes", async () => {
  const src = JSON.parse(
    (await readFile(`${fixturesPath}/font-sizes-theme.json`)).toString()
  );
  const expected = (
    await readFile(`${fixturesPath}/font-sizes-theme-formatted.json`)
  ).toString();

  const actual = await formatWPJson(src);

  expect(actual).toEqual(expected);
});
