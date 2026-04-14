import { expect, test, describe } from "vitest";
import { parseKeyPaths } from "../lib/parse-key-paths.js";

describe("parseKeyPaths", () => {
  test("splits positive and negative key paths correctly", () => {
    const input = [
      "settings.advanced",
      "!settings.color.presets",
      "typography.fontSize",
    ];
    const [positive, negative] = parseKeyPaths(input);

    expect(positive).toEqual([
      ["settings", "advanced"],
      ["typography", "fontSize"],
    ]);
    expect(negative).toEqual([["settings", "color", "presets"]]);
  });

  test("handles empty array", () => {
    const [positive, negative] = parseKeyPaths([]);
    expect(positive).toEqual([]);
    expect(negative).toEqual([]);
  });

  test("handles only positive paths", () => {
    const input = ["a.b", "c.d.e"];
    const [positive, negative] = parseKeyPaths(input);
    expect(positive).toEqual([
      ["a", "b"],
      ["c", "d", "e"],
    ]);
    expect(negative).toEqual([]);
  });

  test("handles only negative paths", () => {
    const input = ["!x.y", "!z"];
    const [positive, negative] = parseKeyPaths(input);
    expect(positive).toEqual([]);
    expect(negative).toEqual([["x", "y"], ["z"]]);
  });

  test("handles single part paths", () => {
    const input = ["single", "!neg"];
    const [positive, negative] = parseKeyPaths(input);
    expect(positive).toEqual([["single"]]);
    expect(negative).toEqual([["neg"]]);
  });
});
