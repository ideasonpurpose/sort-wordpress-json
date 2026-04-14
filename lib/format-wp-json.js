// @ts-check

import * as prettier from "prettier";
import { parseTree, findNodeAtLocation } from "jsonc-parser";
import { parseKeyPaths } from "./parse-key-paths.js";

/**
 * Convert a detectIndent object to Prettier options.
 * amount = 0 returns false.
 * no input or bad data returns an empty object (Prettier defaults).
 *
 * @link https://github.com/sindresorhus/detect-indent?tab=readme-ov-file#api
 * @link https://prettier.io/docs/options#tab-width
 * @param {import("../types").Indent| any} indent
 * @returns {import("prettier").Options|false}
 */
export function convertDetectIndentToPrettier(indent) {
  if (indent == null) {
    return {};
  }

  if (indent.amount === 0) {
    return false;
  }

  if (indent.type === "tab") {
    return { useTabs: true };
  }

  if (Number.isFinite(indent.amount) && indent.amount > 0) {
    return { tabWidth: indent.amount };
  }

  return {};
}

/**
 * Returns the indentation string before the line containing
 * propertyIndex.
 * If it's a condensed file, or the first line, indentation
 * will be "";
 */
function getLineIndent(jsonString, propertyIndex) {
  const lastLine = jsonString.slice(0, propertyIndex).split("\n").pop();
  return lastLine.match(/^\s*/)[0];
}

const defaults = [
  "settings.layout",
  "!settings.color.duotone",
  "!settings.color.palette",
  "!settings.typography.fontSizes",
];

/**
 * @param {Object} wpJsonObject
 * @param {Object} indent - output of detect-indent
 * @param {Array<string>} expansions - array of key paths to expand (with "!" prefix for collapse)
 * @returns {Promise<string>} formatted JSON string
 *
 * @link https://github.com/sindresorhus/detect-indent?tab=readme-ov-file#api
 */
export async function formatWPJson(wpJsonObject, indent, expansions = []) {
  const jsonString = JSON.stringify(wpJsonObject);

  const indentation = convertDetectIndentToPrettier(indent);

  if (!indentation) {
    return jsonString;
  }

  let formattedJson = await prettier.format(jsonString, {
    parser: "json",
    ...indentation,
  });

  let tree = parseTree(formattedJson);

  const _nodes = [...defaults, ...expansions];
  const [nodesToExpand, nodesToCollapse] = parseKeyPaths(_nodes);

  for (const nodePath of nodesToExpand) {
    const node = findNodeAtLocation(tree, nodePath);
    if (node) {
      const nodeStart = node.offset;
      const nodeEnd = node.offset + node.length;
      const nodeString = formattedJson.slice(nodeStart, nodeEnd);
      const nodeJson = JSON.parse(nodeString);
      const newIndent = getLineIndent(formattedJson, nodeStart);

      const nodeJsonString = JSON.stringify(nodeJson).replace(/\{"/, '{\n"');

      const nodeJsonStringFormattted = await prettier.format(nodeJsonString, {
        parser: "json",
        ...indentation,
      });

      formattedJson =
        formattedJson.slice(0, nodeStart) +
        nodeJsonStringFormattted.trim().replace(/\n/g, `\n${newIndent}`) +
        formattedJson.slice(nodeEnd);
    }
  }

  // collapse all nodesToCollapse children
  for (const nodePath of nodesToCollapse) {
    tree = parseTree(formattedJson);

    const node = findNodeAtLocation(tree, nodePath);
    if (node && node.type === "array" && node.children.length > 0) {
      const nodeStart = node.offset;
      const nodeEnd = node.offset + node.length;
      const newIndent = getLineIndent(formattedJson, nodeStart);
      const baseIndent = indent.indent ?? "  ";

      const childNodes = [];
      for (const child of node.children) {
        const childStart = child.offset;
        const childEnd = child.offset + child.length;

        const childString = formattedJson.slice(childStart, childEnd);
        const childJson = JSON.parse(childString);

        const childJsonString = await prettier.format(
          JSON.stringify(childJson),
          { parser: "json", printWidth: Infinity, ...indentation },
        );

        childNodes.push(newIndent + baseIndent + childJsonString.trim());
      }

      const childNodesString = childNodes.length
        ? "[\n" + childNodes.join(",\n") + `\n${newIndent}]`
        : "";

      formattedJson =
        formattedJson.slice(0, nodeStart) +
        childNodesString +
        formattedJson.slice(nodeEnd);
    }
  }

  return formattedJson;
}
