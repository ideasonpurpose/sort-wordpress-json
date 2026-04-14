import { expect, test, describe } from "vitest";
import { formatWPJson } from "../lib/format-wp-json.js";

import { readFile } from "node:fs/promises";
import detectIndent from "detect-indent";

const fixturesPath = "test/fixtures/format";

describe("Format WP JSON", () => {
  test("Collapse color arrays", async () => {
    const src = (
      await readFile(`${fixturesPath}/palette-theme.json`)
    ).toString();

    const input = JSON.parse(src);
    const expected = (
      await readFile(`${fixturesPath}/palette-theme-formatted.json`)
    ).toString();

    const indent = detectIndent(src);
    const actual = await formatWPJson(input, indent);

    expect(actual).toEqual(expected);
  });

  test("Empty indent object", async () => {
    const src = (
      await readFile(`${fixturesPath}/palette-theme.json`)
    ).toString();
    const input = JSON.parse(src);

    const expected = (
      await readFile(`${fixturesPath}/palette-theme-formatted.json`)
    ).toString();

    const actual = await formatWPJson(input, {});

    expect(actual).toEqual(expected);
  });

  test("Zero indent", async () => {
    const src = (
      await readFile(`${fixturesPath}/palette-theme.json`)
    ).toString();
    const input = JSON.parse(src);

    const expected = (
      await readFile(`${fixturesPath}/palette-theme-formatted-0spaces.json`)
    ).toString();

    const actual = await formatWPJson(input, { amount: 0 });

    expect(actual).toEqual(expected);
  });

  test("Indent with tabs", async () => {
    const src = (
      await readFile(`${fixturesPath}/palette-theme.json`)
    ).toString();
    const input = JSON.parse(src);

    const actual = await formatWPJson(input, { indent: "\t", type: "tab" });

    expect(actual).toMatch("{\n\t");
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

  test("Correct condensed key:object bracket spacing", async () => {
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
});

describe("Buggy edge cases", async () => {
  test("Bad indentation", async () => {
    const src = (
      await readFile(`${fixturesPath}/bad-indentation.json`)
    ).toString();
    const input = JSON.parse(src);

    const expected = (
      await readFile(`${fixturesPath}/bad-indentation-formatted.json`)
    ).toString();

    const indent = detectIndent(src);
    const actual = await formatWPJson(input, indent);

    expect(actual).toEqual(expected);
  });
});
