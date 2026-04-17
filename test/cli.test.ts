import { expect, test, describe, vi, beforeEach } from "vitest";
import { coerceIndent, writeOutput, main } from "../cli.js";

vi.mock("fs/promises", () => ({ writeFile: vi.fn() }));
vi.mock("fast-glob", () => ({ default: vi.fn() }));

// Mock lib functions
vi.mock("../lib/find-files.js");
vi.mock("../lib/process-file.js");

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

describe("main", async () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  const fg = vi.mocked(await import("fast-glob")).default;
  const { findThemeFiles } = vi.mocked(await import("../lib/find-files.js"));
  const { processFile } = vi.mocked(await import("../lib/process-file.js"));
  const { writeFile } = vi.mocked(await import("fs/promises"));

  const fakeIndent = { amount: 2, indent: "  ", type: "space" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("with argFile, files found, success", async () => {
    const argv = {
      file: "pattern",
      indent: fakeIndent,
      dryRun: false,
      overrides: [],
      expansions: [],
      noDefaultOverrides: false,
    };
    fg.mockResolvedValue([
      "file1.json",
      "file2-skipped.json",
      "file3-error.json",
    ]);
    processFile.mockResolvedValueOnce({
      file: "file1.json",
      status: "success",
      content: "content1",
      fullPath: "/path/file1.json",
      duration: 1234
    });
    processFile.mockResolvedValueOnce({
      file: "file2-skipped.json",
      status: "skipped",
    });
    processFile.mockResolvedValueOnce({
      file: "file3-error.json",
      status: "error",
      error: new Error("test error"),
    });

    await main(argv);

    expect(fg).toHaveBeenCalledWith("pattern");
    expect(consoleErrSpy).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  test("no files matched file arg", async () => {
    fg.mockResolvedValue([]);
    await main({ file: "nope" });
    expect(consoleErrSpy).toHaveBeenCalledTimes(1);
  });

  test("no file arg, no theme.json found", async () => {
    findThemeFiles.mockResolvedValue(["file.json"]);
    await main({});
    expect(consoleErrSpy).toHaveBeenCalledTimes(1);
  });

  test("no file arg, theme.json found", async () => {
    findThemeFiles.mockResolvedValue(["theme.json"]);
    processFile.mockResolvedValue({ file: "theme.json", status: "success" });

    await main({});
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledTimes(1);
  });
});
