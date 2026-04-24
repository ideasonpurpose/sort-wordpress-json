import { vi, expect, test, describe, beforeEach } from "vitest";
import {
  cacheGet,
  cacheSet,
  cacheClear,
  cacheKeyExists,
  cacheList,
} from "../lib/cache.js";
import { create, clearAll, get, set, save } from "flat-cache";

vi.mock("flat-cache", () => {
  const mockCache = {
    keys: vi.fn(() => ["existing-key"]),
    get: vi.fn(),
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
  const mockCache = create();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("cacheGet", async () => {
    const expected = "cached value";
    mockCache.get.mockReturnValue(expected);
    const actual = cacheGet("test-key");
    expect(actual).toBe(expected);
    expect(mockCache.get).toHaveBeenCalledWith("test-key");
  });

  test("cacheSet", async () => {
    cacheSet("test-key", "test-value", 100);
    expect(mockCache.set).toHaveBeenCalledWith("test-key", "test-value", 100);
    expect(mockCache.save).toHaveBeenCalled();
  });

  test("cacheClear", async () => {
    cacheClear();
    expect(clearAll).toHaveBeenCalled();
  });

  test("cacheKeyExists", async () => {
    expect(cacheKeyExists("existing-key")).toBe(true);
    expect(cacheKeyExists("non-existing")).toBe(false);
    expect(cacheKeyExists("")).toBe(false);
    expect(cacheKeyExists(false)).toBe(false);
    expect(cacheKeyExists(undefined)).toBe(false);
  });

  test("cacheList", async () => {
    const actual = cacheList();
    expect(actual).toHaveProperty("keys");
    expect(actual).toHaveProperty("dir");
    expect(actual).toHaveProperty("count");
    expect(actual).toHaveProperty("items");
  });
});
