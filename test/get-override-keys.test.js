import { describe, expect, test } from "vitest";
import { getOverrideKeys } from "../lib/schema-sort.js";

describe("getOverrideKeys Tests", async () => {
  test("Get single key from overrides", async () => {
    const path = ["settings", "color"];
    const overrides = [
      "settings.layout",
      "settings.color",
      "settings.color.gradient",
      "settings.color.gradient.foreground", // fake, just for testing
      "styles.blocks.color.text",
    ];

    const expected = getOverrideKeys(overrides, path);

    expect(expected).toStrictEqual(["gradient"]);
  });

  test("Get multiple keys from overrides", async () => {
    const path = ["settings", "color"];
    const overrides = [
      "settings.layout",
      "settings.color",
      "settings.color.link",
      "settings.color.custom",
      "settings.color.gradient",
      "styles.blocks.color.text",
    ];

    const expected = getOverrideKeys(overrides, path);

    expect(expected).toStrictEqual(["link", "custom", "gradient"]);
  });

  test("Return an empty array when nothing matches", async () => {
    const path = ["styles", "color"];
    const overrides = ["settings.layout", "styles.blocks.color.text"];

    const expected = getOverrideKeys(overrides, path);

    expect(expected).toStrictEqual([]);
  });

  test("Get only the last override key for subpaths", async () => {
    const overrides = [
      "settings.color.link",
      "settings.color.custom",
      "settings.color.custom.deeper",
    ];

    const path = ["settings"];
    const expected = [];
    const actual = getOverrideKeys(overrides, path);
    expect(actual).toStrictEqual(expected);

    const path1 = ["settings", "color"];
    const expected1 = ["link", "custom"];
    const actual1 = getOverrideKeys(overrides, path1);
    expect(actual1).toStrictEqual(expected1);

    const path2 = ["settings", "color", "custom"];
    const expected2 = ["deeper"];
    const actual2 = getOverrideKeys(overrides, path2);
    expect(actual2).toStrictEqual(expected2);

    const path3 = ["settings", "color", "deeper", "deepest"];
    const expected3 = [];
    const actual3 = getOverrideKeys(overrides, path3);
    expect(actual3).toStrictEqual(expected3);
  });
});
