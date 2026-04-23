import { expect, test, describe } from "vitest";
import { coerceIndent } from "../lib/coerce-indent.js";

describe("coerceInput helper", () => {
  test("returns correct object for 'tabs'", () => {
    const result = coerceIndent("tabs");
    expect(result).toEqual({ amount: 1, indent: "\t", type: "tab" });
  });

  test("returns correct object for 'tab'", () => {
    const result = coerceIndent("tab");
    expect(result).toEqual({ amount: 1, indent: "\t", type: "tab" });
  });

  test("returns correct object for number input", () => {
    const result = coerceIndent(4);
    expect(result).toEqual({ amount: 4, indent: "    ", type: "space" });
  });

  test("clamps number input to 10", () => {
    const result = coerceIndent(20);
    const indent = 10;
    expect(result).toEqual({
      amount: indent,
      indent: ' '.repeat(indent),
      type: "space",
    });
  });

  test("clamps negative number input to 0", () => {
    const result = coerceIndent(-5);
    expect(result).toEqual({ amount: 0, indent: "", type: "space" });
  });

  test("returns false for invalid input", () => {
    const result = coerceIndent("invalid");
    expect(result).toBe(false);
  });
});
