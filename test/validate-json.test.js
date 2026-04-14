import { expect, test, describe } from "vitest";
import { validateJson } from "../lib/validate-json";
import { check } from "yargs";

describe("Validate JSON", async () => {
  test("Check two objects", async () => {
    const original = { a: 1, b: 2 };
    const sorted = { b: 2, a: 1 };
    expect(validateJson(original, sorted)).toBe(true);
  });

  test("Check two strings", async () => {
    const original = JSON.stringify({ a: 1, b: 2 });
    const sorted = JSON.stringify({ b: 2, a: 1 });
    expect(validateJson(original, sorted)).toBe(true);
  });

  test("Check object and string", async () => {
    const original = { a: 1, b: 2 };
    const sorted = JSON.stringify({ b: 2, a: 1 });
    expect(validateJson(original, sorted)).toBe(true);
  });

  test("Check invalid original JSON string", async () => {
    const original = "{ a: 1, b: 2 }"; // Invalid JSON (keys must be in double quotes)
    const sorted = JSON.stringify({ b: 2, a: 1 });
    expect(() => validateJson(original, sorted)).toThrow(
      "Original is not valid JSON",
    );
  });

  test("Check invalid original JSON string", async () => {
    const original = "not JSON";
    const sorted = "{ b: 2, a: 1 }"; // Invalid JSON (keys must be in double quotes)
    expect(() => validateJson(original, sorted)).toThrow(
      "Original is not valid JSON",
    );
  });

  test("Check invalid sorted JSON string", async () => {
    const original = JSON.stringify({ a: 1, b: 2 });
    const sorted = "not JSON";
    expect(() => validateJson(original, sorted)).toThrow(
      "Sorted is not valid JSON",
    );
  });

  test("Check non-equivalent objects", async () => {
    const original = { a: 1, b: 2 };
    const sorted = { a: 1, b: 3 }; // Different value for key 'b'
    expect(() => validateJson(original, sorted)).toThrow(
      "Something went wrong, input and output files are not equivalent",
    );
  });
});
