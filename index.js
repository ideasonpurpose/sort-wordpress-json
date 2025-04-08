//@ts-check

import { readFile } from "node:fs/promises";
import isEqual from "lodash.isequal";
/**
 * Should return a Set
 *
 * note: not really override, this is the default sort order
 */
function getSortKeyOverrides(keyPathRaw) {
  // construct some sort of dictionary of arrays based on the schema and overrides

  /**
   *
   * Something needs to happen here to extract the key lists from the various
   * definitions described in the file. Because the structure of the file can
   * be semi-recursive:
   *    eg. Styles > Blocks > Block contains typography and elements, those
   *        contained elements also contain typography

   */

  const overrides = {
    root: ["$schema", "version", "title", "settings", "styles"],

    settings: ["layout", "spacing", "color"],
    "settings.spacing": ["margin"],
    "settings.color": [
      "custom",
      "defaultPalette",
      "palette",
      "customGradient",
      "defaultGradients",
      "gradients",
    ],
    styles: ["blocks", "elements"],
    margin: ["top", "right", "bottom", "left"],
    padding: ["top", "right", "bottom", "left"],
  };

  const keyPath = keyPathRaw.length ? keyPathRaw.join(".") : "root";
  const keys = overrides[keyPath] ?? overrides["root"];
  // console.log({ keyPathRaw, keyPath, keys, k2: new Set(keys) });
  return new Set(keys);
}

// TODO: Need to establish context, then recognize



function writeOutputFile(srcPath) {
  // First, check that the output file and the source file are functionally identical
  // This should check for indentation, then reformat JSON based on the discoverd String.

  /**
   * Compare input and output objects, only overwrite the source file if they're
   * equivalent (deep-equality, order-ignored)
   *
   * Failsafe for unexpected bugs
   */
  if (isEqual(srcJson, destJson)) {
    const outfile = JSON.stringify(destJson, null, indent);
    // write it out
  } else {
    throw new Error(
      "Something went wrong, input and output files are not equivalent"
    );
  }
}



function sortWPJson(srcJSON) {


  // load the local Schema file
  // extract the schema
  // sort the file
  // check the file
  // write output.
  // TODO: Handle objects, buffers and strings

  // if (Buffer.isBuffer(srcJSON)) {
  //   srcJSON = srcJSON.toString();
  // }

  // if (typeof srcJSON === "string") {
  //   srcJSON = JSON.parse(srcJSON);
  // }

}





export default sortWPJson;
