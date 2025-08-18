// @ts-check

import * as prettier from "prettier";
import { parseTree, findNodeAtLocation } from "jsonc-parser";

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

/**
 * TODO: Shouldn't these be a config item somewhere else?
 * While they're specific to this, it's dumb to bake
 * them in here.
 * Values are JSONPaths, which is basically a dot-path
 * blown up and passed as an array.
 * eg. styles.elements.h1 => ['styles', 'elements', 'h1']
 */
const nodesToExpand = [["settings", "layout"]];

// ToCollapse are all arrays?
const nodesToCollapse = [
  ["settings", "typography", "fontSizes"],
  ["settings", "color", "palette"],
];

/**
 *
 * @param {Object} wpJsonObject
 * @param {Object} indent - output of detect-indent
 * @link https://github.com/sindresorhus/detect-indent?tab=readme-ov-file#api
 */
export async function formatWPJson(wpJsonObject, indent) {
  const jsonString = JSON.stringify(wpJsonObject);

  if (!indent?.indent) {
    return jsonString;
  }

  const indentation =
    indent.type === "space" ? { tabWidth: indent.amount } : { useTabs: true };

  let formattedJson = await prettier.format(jsonString, {
    parser: "json",
    ...indentation,
  });

  let tree = parseTree(formattedJson);

  nodesToExpand.forEach((nodePath) => {
    const node = findNodeAtLocation(tree, nodePath);
    if (node) {
      const nodeStart = node.offset;
      const nodeEnd = node.offset + node.length;
      const nodeString = formattedJson.slice(nodeStart, nodeEnd);
      const nodeJson = JSON.parse(nodeString);
      const newIndent = getLineIndent(formattedJson, nodeStart);
      const nodeJsonString = JSON.stringify(
        nodeJson,
        null,
        indent.indent
      ).replace(/\n/g, `\n${newIndent}`);

      formattedJson =
        formattedJson.slice(0, nodeStart) +
        nodeJsonString +
        formattedJson.slice(nodeEnd);
    }
  });

  tree = parseTree(formattedJson);

  // collapsing all children
  nodesToCollapse.forEach((nodePath) => {
    const node = findNodeAtLocation(tree, nodePath);
    if (node) {
      const nodeStart = node.offset;
      const nodeEnd = node.offset + node.length;
      const newIndent = getLineIndent(formattedJson, nodeStart);

      const childNodes = node.children.map((child) => {
        const childStart = child.offset;
        const childEnd = child.offset + child.length;

        const childString = formattedJson.slice(childStart, childEnd);
        const childJson = JSON.parse(childString);

        const childJsonString = JSON.stringify(childJson)
          .replace(/\{"/g, '{ "')
          .replace(/"\}/g, '" }')
          .replace(/"([,:])"/g, '"$1 "');

        return newIndent + indent.indent + childJsonString;
      });

      formattedJson =
        formattedJson.slice(0, nodeStart) +
        "[\n" +
        childNodes.join(",\n") +
        `\n${newIndent}]` +
        formattedJson.slice(nodeEnd);
    }
  });

  return formattedJson;
}
