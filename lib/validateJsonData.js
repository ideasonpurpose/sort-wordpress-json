import isEqual from "lodash.isequal";

/**
 * Validates that the original and sorted JSON data are equivalent.
 * Throws an error if they are not equal.
 * @param {any} original - The original JSON data.
 * @param {any} sorted - The sorted JSON data.
 * @returns {any} The sorted data if validation passes.
 */
export function validateJsonData(original, sorted) {
  if (!isEqual(original, sorted)) {
    throw new Error(
      "Something went wrong, input and output files are not equivalent",
    );
  }
  return sorted;
}