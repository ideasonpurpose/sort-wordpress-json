// @ts-check

import fg from "fast-glob";

/**
 * Finds all './theme.json', './styles/** /*.json' and './** /block.json' files in the current directory.
 * Only returns results if the top-level theme.json file is found.
 * @returns {Promise<string[]>} Array of matching file paths, or empty array if theme.json not found.
 */
export async function findThemeFiles(cwd = process.cwd()) {
  const ignore = ["**/dist", "**/acf-json", "**/node_modules", "**/vendor"];
  const patterns = ["theme.json", "styles/**/*.json", "**/block.json"];
  return await fg(patterns, { cwd, ignore });
}
