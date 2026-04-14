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

  test("skipped when no schema", async () => {
    readFile.mockResolvedValue(JSON.stringify(inputJson));

    const actual = await processFile(fakePath);

    expect(actual).toHaveProperty("status", "skipped");
  });

  test("indent provided, detectIndent not called", async () => {
    readFile.mockResolvedValue(JSON.stringify(inputJson));
    getSchema.mockResolvedValue({ schema: true });
    schemaSort.mockResolvedValue(inputJson);
    formatWPJson.mockResolvedValue("formatted");
    validateJson.mockResolvedValue(true);

    const actual = await processFile(fakePath, {});

    expect(actual).toHaveProperty("status", "success");
  });

  test("error on readFile", async () => {
    readFile.mockRejectedValue(new Error());

    const actual = await processFile(fakePath);

    expect(actual).toHaveProperty("file", fakePath);
    expect(actual).toHaveProperty("status", "error");
  });
});
