import { vi, expect, test, describe } from "vitest";
import { cacheKeyExists } from "../lib/cache.js";

vi.mock("flat-cache", () => {
  const mockCache = {
    keys: vi.fn(() => ["existing-key"]),
    getKey: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
  };

  return {
    create: vi.fn(() => mockCache),
    clearAll: vi.fn(),
    clearCacheById: vi.fn(),
  };
});

describe("Cache", async () => {
  test("cacheKeyExists", async () => {
    expect(cacheKeyExists("existing-key")).toBe(true);
    expect(cacheKeyExists("non-existing")).toBe(false);
    expect(cacheKeyExists("")).toBe(false);
    expect(cacheKeyExists(false)).toBe(false);
    expect(cacheKeyExists(undefined)).toBe(false);
  });
});
