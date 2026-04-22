import { expect, test, describe, vi } from "vitest";
import { readFile } from "node:fs/promises";

import $RefParser from "@apidevtools/json-schema-ref-parser";

vi.mock('../lib/get-schema.js');
import { getSchema } from "../lib/get-schema.js";
import { resolveProps, flattenProps } from "../lib/resolve-props.js";

describe("resolveProps", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const schema = { type: 'object' };
  getSchema.mockResolvedValue(schema);
  await $RefParser.dereference(schema);

  test("flattenProps allOf", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/all-of/nested-all-of.json`),
    );

    const actual = flattenProps({}, fakeSchema.properties.styles.allOf);

    expect(Object.keys(actual)).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
    ]);
  });

  test("flattenProps anyOf", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/any-of/radius-props.json`),
    );

    const actual = flattenProps({}, fakeSchema.properties.radius.anyOf);

    expect(Object.keys(actual)).toEqual([
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
    ]);
  });

  test("flattenProps nested anyOf", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/any-of/nested-any-of.json`),
    );

    const actual = flattenProps({}, fakeSchema.properties.styles.anyOf);

    expect(Object.keys(actual)).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
    ]);
  });

  test("flattenProps oneOf", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/one-of/fluid-one-of.json`),
    );

    const actual = flattenProps({}, fakeSchema.properties.fluid.oneOf);

    expect(Object.keys(actual)).toEqual(["north", "south", "east", "west"]);
  });

  test("anyOf for coverage", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/any-of/nested-any-of.json`),
    );

    const actual = resolveProps(fakeSchema.properties);
    expect(Object.keys(actual.styles.properties)).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
    ]);
  });

  test("oneOf for coverage", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/one-of/fluid-one-of.json`),
    );

    const actual = resolveProps(fakeSchema.properties);
    expect(Object.keys(actual.fluid.properties)).toEqual([
      "north",
      "south",
      "east",
      "west",
    ]);
  });

  /**
   * Settings has a nested allOf in the top-level allOf
   * both should be merged.
   */
  test("Settings properties", async () => {
    const actual = resolveProps(schema.properties);

    expect(actual).toHaveProperty("settings");
    expect(actual).toHaveProperty("settings.properties.position");
    expect(actual).toHaveProperty("settings.properties.shadow"); // from nested allOf
    expect(actual).toHaveProperty("settings.properties.blocks"); // second object in allOf
    expect(actual).toHaveProperty("styles.description"); // check plain properties
  });

  test("Styles properties", async () => {
    const actual = resolveProps(schema.properties);

    expect(actual).toHaveProperty("styles");
    expect(actual).toHaveProperty("styles.properties.background");
    expect(actual).toHaveProperty("styles.properties.blocks"); // second object in allOf
    expect(actual).toHaveProperty("styles.description"); // check plain properties
  });
});
