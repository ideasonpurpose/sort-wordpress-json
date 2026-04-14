import { expect, test, describe } from "vitest";
import { convertDetectIndentToPrettier } from "../lib/format-wp-json.js";

describe("convertDetectIndentToPrettier", () => {
  test("undefined", () => {
    expect(convertDetectIndentToPrettier(undefined)).toEqual({});
  });

  test("empty input", () => {
    expect(convertDetectIndentToPrettier({})).toEqual({});
    expect(convertDetectIndentToPrettier({ indent: "invalid" })).toEqual({});
  });

  test("convert spaces", () => {
    const indent = { type: "space", amount: 4 };
    expect(convertDetectIndentToPrettier(indent)).toEqual({ tabWidth: 4 });
  });

  test("convert tabs", () => {
    const indent = { type: "tab", amount: 1 };
    expect(convertDetectIndentToPrettier(indent)).toEqual({ useTabs: true });
  });
});
