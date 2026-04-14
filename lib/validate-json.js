import isEqual from "lodash.isequal";

/**
 * Validates that two JSON values (objects or strings) are equivalent.
 * Parses strings to objects if necessary, then checks deep equality.
 * Throws an error if they are not equal.
 * @param {any|string} _original - The original JSON data (object or string).
 * @param {any|string} _sorted - The sorted JSON data (object or string).
 * @returns {boolean} True if validation passes.
 */
export function validateJson(_original, _sorted) {
  let original, sorted;

  try {
    original =
      typeof _original === "string" ? JSON.parse(_original) : _original;
  } catch (e) {
    throw new Error(`Original is not valid JSON: ${e.message}`);
  }

  try {
    sorted = typeof _sorted === "string" ? JSON.parse(_sorted) : _sorted;
  } catch (e) {
    throw new Error(`Sorted is not valid JSON: ${e.message}`);
  }

  if (!isEqual(original, sorted)) {
    throw new Error(
      "Something went wrong, input and output files are not equivalent",
    );
  }

  return true;
}
