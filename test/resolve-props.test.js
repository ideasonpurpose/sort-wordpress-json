import { expect, test, describe } from "vitest";
import { readFile } from "node:fs/promises";

import $RefParser from "@apidevtools/json-schema-ref-parser";

import { getSchema } from "../lib/get-schema.js";
import { resolveProps, flattenProps } from "../lib/resolve-props.js";

describe("resolveProps", async () => {
  const schema = await getSchema();
  await $RefParser.dereference(schema);

  test("flattenProps allOf", async () => {
    const fakeSchema = JSON.parse(
      await readFile(`./test/fixtures/all-of/nested-all-of.json`)
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
      await readFile(`./test/fixtures/any-of/radius-props.json`)
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
      await readFile(`./test/fixtures/any-of/nested-any-of.json`)
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
