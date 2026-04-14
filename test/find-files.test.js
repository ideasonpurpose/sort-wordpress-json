import { describe, expect, test, vi } from "vitest";
import { findThemeFiles } from "../lib/find-files.js";

// Mock fast-glob
vi.mock("fast-glob", () => ({
  default: vi.fn(),
}));

describe("findThemeFiles", () => {
  test("returns empty array when no files found", async () => {
    const fg = (await import("fast-glob")).default;

    await findThemeFiles();
    expect(fg).toHaveBeenCalled();
    expect(fg.mock.calls[0][0]).toContain("theme.json");
    expect(fg.mock.calls[0][1]).toHaveProperty("cwd");
    expect(fg.mock.calls[0][1]).toHaveProperty("ignore");
  });
});
