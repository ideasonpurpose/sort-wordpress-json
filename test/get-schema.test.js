import { describe, expect, test, vi, beforeEach } from "vitest";
import * as getSchemaModule from "../lib/get-schema.js";
import { cacheGet, cacheSet } from "../lib/cache.js";

const { getSchema } = getSchemaModule;

// Mock the entire module
vi.mock("@apidevtools/json-schema-ref-parser", () => ({
  default: {
    bundle: vi.fn(),
  },
}));

// Mock the cache module
vi.mock("../lib/cache.js", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}));

describe("getSchema Tests", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const $RefParser = (await import("@apidevtools/json-schema-ref-parser"))
    .default;

  const bundleMock = $RefParser.bundle;

  const fakeSrc = "https://example.com/fake_schema.json";

  beforeEach(() => {
    bundleMock.mockReset();
  });

  test("load remote schema", async () => {
    getCached.mockReturnValue(null);
    bundleMock.mockResolvedValue({ fake: "schema" });

    const actual = await getSchema(fakeSrc);

    expect(getCached).toHaveBeenCalledWith(fakeSrc);
    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);
    expect(setCached).toHaveBeenCalledWith(fakeSrc, { fake: "schema" });
    expect(actual).toEqual({ fake: "schema" });
  });

  test("load from cache", async () => {
    getCached.mockReturnValue({ cached: "schema" });

    const actual = await getSchema(fakeSrc);

    expect(getCached).toHaveBeenCalledWith(fakeSrc);
    expect(bundleMock).toHaveBeenCalledTimes(0);
    expect(actual).toEqual({ cached: "schema" });
  });

  test("remote fails", async () => {
    getCached.mockReturnValue(null);
    bundleMock.mockRejectedValue(new Error("mock rejection"));

    const actual = await getSchema(fakeSrc);

    expect(getCached).toHaveBeenCalledWith(fakeSrc);
    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);
    expect(actual).toEqual(false);
  });

  test("no schema url", async () => {
    const actual = await getSchema(null);

    expect(bundleMock).toHaveBeenCalledTimes(0);
    expect(actual).toEqual(false);
  });
});
    expect(localSchemaPath).toBeTruthy();
    expect(localSchemaPath).toMatch(/theme\.json$/);
  });

  test("no matching local schema", async () => {
    const localSchemaPath = getLocalSchemaPath("somefile/nope.json");
    expect(localSchemaPath).toBeNull();
  });
});
