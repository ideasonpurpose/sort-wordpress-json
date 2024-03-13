import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { sortWPJson } from "../index.js";

test("Test setup", async () => {
  const actual = 5;

  expect(actual).toBe(5);
  expect(actual).not.toBe("5");
});

test("Test fixtures", async () => {
  const input = await readFile("./test/fixtures/presorted.json");
  const expected = JSON.parse(
    (await readFile("./test/fixtures/sorted.json")).toString()
  );
  const actual = sortWPJson(input);

  expect(Object.keys(actual)).not.toEqual(Object.keys(expected));
});

test("call sortWPJson", async () => {
  const input = { a: 1, b: 2, c: 3 };
  const expected = { c: 3, b: 2, a: 1 };
  const actual = sortWPJson(input);

  expect(Object.keys(actual)).toEqual(Object.keys(expected));
});
