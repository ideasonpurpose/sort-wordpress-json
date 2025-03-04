import { describe, expect, test, vi, beforeEach } from "vitest";
import { getSchema } from "../lib/get-schema.js";

// Mock the entire module
vi.mock("@apidevtools/json-schema-ref-parser", () => ({
  default: {
    bundle: vi.fn(),
  },
}));

describe("getSchema Tests", async () => {
  const $RefParser = (await import("@apidevtools/json-schema-ref-parser"))
    .default;

  const bundleMock = $RefParser.bundle;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("load remote schema", async () => {
    bundleMock.mockResolvedValue({ fake: "schema" });

    const fakeSrc = { $schema: "https://example.com/schema.json" };
    await getSchema(fakeSrc);

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith("https://example.com/schema.json");
  });

  test("remote fails, fallback to local", async () => {
    bundleMock.mockRejectedValueOnce(new Error("mock rejection"));
    bundleMock.mockResolvedValueOnce({ fake: "schema" });

    const fakeSrc = { $schema: "https://example.com/schema.json" };

    await getSchema(fakeSrc);
    expect(bundleMock).toHaveBeenCalledTimes(2);

    expect(bundleMock)
      .toHaveBeenCalledWith("https://example.com/schema.json")
      .toHaveBeenCalledWith("schema/theme.json");
  });
});
