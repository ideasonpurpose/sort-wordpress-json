import { expect, test, describe, vi, beforeEach } from "vitest";

import { processFile } from "../lib/process-file.js";

// Mock dependencies
vi.mock("../lib/get-schema.js");
vi.mock("../lib/schema-sort.js");
vi.mock("../lib/format-wp-json.js");
vi.mock("../lib/validate-json.js");
vi.mock("fs/promises");
vi.mock("detect-indent");

describe("processFile", async () => {
  const { readFile } = await import("fs/promises");
  const { getSchema } = await import("../lib/get-schema.js");
  const { schemaSort } = await import("../lib/schema-sort.js");
  const { formatWPJson } = await import("../lib/format-wp-json.js");
  const { validateJson } = await import("../lib/validate-json.js");

  const inputJson = { test: "data" };
  const fakePath = "./not/a/file.json";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("indent provided, detectIndent not called", async () => {
    readFile.mockResolvedValue(JSON.stringify(inputJson));
    getSchema.mockResolvedValue({ schema: true });
    schemaSort.mockResolvedValue(inputJson);
    formatWPJson.mockResolvedValue("formatted");
    validateJson.mockResolvedValue(true);

    const actual = await processFile(fakePath, {});

    expect(actual).toHaveProperty("status", "success");
    expect(actual).toHaveProperty("duration");
    expect(actual.duration).toBeGreaterThan(0);
  });

  test("skipped when no schema", async () => {
    readFile.mockResolvedValue(JSON.stringify(inputJson));
    getSchema.mockResolvedValue(false);

    const actual = await processFile(fakePath);

    expect(actual).toHaveProperty("status", "skipped");
  });

  test("skip when getSchema errors", async () => {
    getSchema.mockRejectedValue(new Error("getSchema Error"));

    const actual = await processFile(fakePath);
    expect(actual).toHaveProperty("status", "skipped");
    expect(actual).toHaveProperty("reason", "getSchema Error");
  });

  test("error on readFile", async () => {
    readFile.mockRejectedValue(new Error());

    const actual = await processFile(fakePath);

    expect(actual).toHaveProperty("file", fakePath);
    expect(actual).toHaveProperty("status", "error");
  });

  test("error on invalid JSON", async () => {
    validateJson.mockRejectedValue("invalid json");

    const actual = await processFile(fakePath);

    expect(actual).toHaveProperty("file", fakePath);
    expect(actual).toHaveProperty("status", "error");
  });
});
