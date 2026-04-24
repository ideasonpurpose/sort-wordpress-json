import { describe, expect, test, vi, beforeEach } from "vitest";
import { cacheSchemas } from "../lib/cache-schemas.js";
import $RefParser from "@apidevtools/json-schema-ref-parser";

vi.mock("@apidevtools/json-schema-ref-parser", () => ({
  default: {
    bundle: vi.fn(),
  },
}));

vi.mock("../lib/cache.js", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}));

describe("cacheSchemas", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const bundleMock = $RefParser.bundle;
  bundleMock.mockResolvedValue({ fake: "schema" });

  beforeEach(() => {
    bundleMock.mockReset();
  });

  test("caches a single schema url", async () => {
    const actual = await cacheSchemas("url");

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(actual).toHaveLength(1);
    expect(actual[0]).toHaveProperty("key", "url");
  });

  test("caches an array of schema urls", async () => {
    const actual = await cacheSchemas(["url 1", "url 2"]);

    expect(bundleMock).toHaveBeenCalledTimes(2);
    expect(actual).toHaveLength(2);
    expect(actual[0]).toHaveProperty("key", "url 1");
    expect(actual[1]).toHaveProperty("key", "url 2");
  });

  test("throws an error", async () => {
    bundleMock.mockRejectedValue(new Error("Bundle Error"));

    const actual = await cacheSchemas("url");

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(consoleErrSpy).toHaveBeenCalledWith(
      "Failed to cache url:",
      "Bundle Error",
    );
    expect(actual).toHaveLength(0);
  });
});
