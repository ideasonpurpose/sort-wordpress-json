import { expect, test, describe, vi, beforeEach } from "vitest";
import { coerceIndent, writeOutput, main } from "../cli.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({ writeFile: vi.fn() }));

// // Mock detectIndent
// vi.mock("detect-indent", () => ({
//   default: vi.fn(),
// }));

// // Mock the lib functions
// vi.mock("../lib/get-schema.js", () => ({
//   getSchema: vi.fn(),
// }));

// vi.mock("../lib/schema-sort.js", () => ({
//   schemaSort: vi.fn(),
// }));

// vi.mock("../lib/format-wp-json.js", () => ({
//   formatWPJson: vi.fn(),
// }));

// import detectIndent from "detect-indent";
// import { getSchema } from "../lib/get-schema.js";
// import { schemaSort } from "../lib/schema-sort.js";
// import { formatWPJson } from "../lib/format-wp-json.js";

describe("coerceInput helper", () => {
  test("returns correct object for 'tabs'", () => {
    const result = coerceIndent("tabs");
    expect(result).toEqual({ amount: 1, indent: "\t", type: "tab" });
  });

  test("returns correct object for 'tab'", () => {
    const result = coerceIndent("tab");
    expect(result).toEqual({ amount: 1, indent: "\t", type: "tab" });
  });

  test("returns correct object for number input", () => {
    const result = coerceIndent(4);
    expect(result).toEqual({ amount: 4, indent: "    ", type: "space" });
  });

  test("clamps number input to 10", () => {
    const result = coerceIndent(20);
    expect(result).toEqual({
      amount: 10,
      indent: "          ",
      type: "space",
    });
  });

  test("clamps negative number input to 0", () => {
    const result = coerceIndent(-5);
    expect(result).toEqual({ amount: 0, indent: "", type: "space" });
  });

  test("returns false for invalid input", () => {
    const result = coerceIndent("invalid");
    expect(result).toBe(false);
  });
});

describe("writeOutput", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const { writeFile } = vi.mocked(await import("fs/promises"));

  const fakePath = "test/path.json";
  const fakeContent = "formatted content";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("dry run with TTY", async () => {
    vi.spyOn(process, "stdout", "get").mockReturnValue({ isTTY: true });

    await writeOutput(fakePath, fakeContent, true);

    expect(consoleLogSpy.mock.calls[0][0]).toMatch(/Dry run/);
    expect(consoleLogSpy).toHaveBeenCalledWith(fakeContent);
    expect(writeFile).not.toHaveBeenCalled();
  });

  test("dry run without TTY", async () => {
    vi.spyOn(process, "stdout", "get").mockReturnValue({ isTTY: false });

    await writeOutput(fakePath, fakeContent, true);

    expect(consoleLogSpy).toHaveBeenCalledWith(fakeContent);
    expect(writeFile).not.toHaveBeenCalled();
  });

  test("not dry run", async () => {
    await writeOutput(fakePath, fakeContent, false);

    expect(writeFile).toHaveBeenCalledWith(fakePath, fakeContent);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
