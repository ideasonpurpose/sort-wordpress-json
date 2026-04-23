/**
 * Coerces an indentation value into a standardized object format.
 * The ten character limit comes from JSON.stringify's maximum supported indentation.
 * @param {string|number} n - The indentation value to coerce. Accepts 'tabs', 'tab', or a number (0-10).
 * @returns {{amount: number, indent: string, type: string} | false} An object for valid inputs, or false for invalid values.
 */
export function coerceIndent(n) {
  const str = String(n).toLowerCase();

  // Handle tab variants (case-insensitive)
  if (str === "tab" || str === "tabs") {
    return { amount: 1, indent: "\t", type: "tab" };
  }

  // Handle numeric values (clamp to 0-10)
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    const amount = Math.max(0, Math.min(10, num));
    return { amount, indent: " ".repeat(amount), type: "space" };
  }

  // Default for 'inherit' and all other invalid values
  return false;
}
