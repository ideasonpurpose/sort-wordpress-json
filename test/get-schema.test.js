import { describe, expect, test, vi, beforeEach } from "vitest";
import * as getSchemaModule from "../lib/get-schema.js";

const { getSchema, getLocalSchemaPath } = getSchemaModule;

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
  const getLocalSchemaPathMock = vi.fn();

  const fakeSrc = "https://example.com/fake_schema.json";
  const fakeLocal = "../local_schema/fake_schema.json";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("load remote schema", async () => {
    bundleMock.mockResolvedValue({ fake: "schema" });

    await getSchema({ $schema: fakeSrc });

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);
  });

  test("remote fails, no fallback", async () => {
    bundleMock.mockThrowOnce(new Error("mock rejection 1"));

    const actual = await getSchema({ $schema: fakeSrc });

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);

    expect(actual).toEqual(false);
  });

  test("remote fails, use fallback", async () => {
    bundleMock.mockThrowOnce(new Error("mock rejection 1"));
    getLocalSchemaPathMock.mockReturnValue(fakeLocal);
    await getSchema({ $schema: fakeSrc }, fakeLocal, getLocalSchemaPathMock);

    expect(bundleMock).toHaveBeenCalledTimes(2);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);
    expect(bundleMock).toHaveBeenCalledWith(fakeLocal);
    expect(getLocalSchemaPathMock).toHaveBeenCalledWith(fakeLocal);
  });

  test("remote fails, fallback fails ", async () => {
    bundleMock.mockThrowOnce(new Error("mock rejection 1"));
    bundleMock.mockThrowOnce(new Error("mock rejection 2"));
    getLocalSchemaPathMock.mockReturnValue(null);

    const actual = await getSchema(
      { $schema: fakeSrc },
      fakeLocal,
      getLocalSchemaPathMock,
    );

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(fakeSrc);
    expect(getLocalSchemaPathMock).toHaveBeenCalledWith(fakeLocal);

    expect(actual).toEqual(false);
  });
});

describe("getLocalSchema helper", async () => {
  test("get local schema for theme.json", async () => {
    const localSchemaPath = getLocalSchemaPath("somefile/theme.json");
    expect(localSchemaPath).toBeTruthy();
    expect(localSchemaPath).toMatch(/theme\.json$/);
  });

  test("no matching local schema", async () => {
    const localSchemaPath = getLocalSchemaPath("somefile/nope.json");
    expect(localSchemaPath).toBeNull();
  });
});
