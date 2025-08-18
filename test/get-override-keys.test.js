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
    const overrides = [
      "settings.layout",
      "styles.blocks.color.text",
    ];

    const expected = getOverrideKeys(overrides, path);

    expect(expected).toStrictEqual([]);
  });
});
