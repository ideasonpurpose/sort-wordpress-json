import { expect, test } from "vitest";
import { formatWPJson } from "../lib/format-wp-json.js";

import { readFile } from "node:fs/promises";
import detectIndent from "detect-indent";

const fixturesPath = "test/fixtures/format";

test("Format WP JSON collapses color arrays", async () => {
  const src = (await readFile(`${fixturesPath}/palette-theme.json`)).toString();

  const input = JSON.parse(src);
  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted.json`)
  ).toString();

  const indent = detectIndent(src);
  const actual = await formatWPJson(input, indent);

  expect(actual).toEqual(expected);
});

test("Format WP JSON with no indent", async () => {
  const src = (await readFile(`${fixturesPath}/palette-theme.json`)).toString();
  const input = JSON.parse(src);

  const expected = (
    await readFile(`${fixturesPath}/palette-theme-formatted-0spaces.json`)
  ).toString();

  const actual = await formatWPJson(input, {});

  expect(actual).toEqual(expected);
});

test("Condense font-sizes", async () => {
  const src = (
    await readFile(`${fixturesPath}/font-sizes-theme.json`)
  ).toString();
  const input = JSON.parse(src);
  const expected = (
    await readFile(`${fixturesPath}/font-sizes-theme-formatted.json`)
  ).toString();

  const indent = detectIndent(src);
  const actual = await formatWPJson(input, indent);

  expect(actual).toEqual(expected);
});

test("Condense margin and padding", async () => {
  const src = (
    await readFile(`${fixturesPath}/block-variation.json`)
  ).toString();
  const input = JSON.parse(src);
  const expected = (
    await readFile(`${fixturesPath}/block-variation-formatted.json`)
  ).toString();

  const indent = detectIndent(src);
  const actual = await formatWPJson(input, indent);

  expect(actual).toEqual(expected);
});
