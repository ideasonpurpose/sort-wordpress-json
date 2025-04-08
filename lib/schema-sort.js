// @ts-check

import $RefParser from "@apidevtools/json-schema-ref-parser";

import getValue from "get-value";
import setValue from "set-value";

import { resolveProps } from "../lib/resolve-props.js";

// TODO: Possibly build in overrides for unconsidered schema order
// const sortProperties = ["styles.blocks", "styles.elements"];

export function walkSchema(schema, src, dest = {}, path = []) {
  const newProps = resolveProps(schema.properties);

  // TODO: Somewhere in here we need to replace the existing object with the new one since
  // the existing object was cloned with all properties, and those existing properties are
  // sticking which prevents re-sorting.

  const srcKeys = Object.keys(src);
  const schemaKeys = Object.keys(newProps);

  let extraKeys = [];
  if (typeof src === "object") {
    extraKeys = Array.from(
      new Set(srcKeys).difference(new Set(schemaKeys))
    ).sort();
  }

  schemaKeys.forEach((schemaKey) => {
    path.push(schemaKey);

    // Use path.length to cap recursion to an arbitrary 16 levels deep, just in case
    if (path.length > 16) {
      throw new Error("We're in too deep! Recursion maximum reached");
    }

    if (src[schemaKey] !== undefined) {
      /**
       * properties[key].type is not always specified for objects. This checks that the node
       * is not any known type besides object
       */
      const nodeType = newProps[schemaKey]?.type;

      // TODO: SOME Arrays should be sorted alphabetically.
      //       Arrays like colors should remain in authored order.

      walkSchema(newProps[schemaKey], src[schemaKey], dest, path);

      let value = src[schemaKey];
      if (newProps[schemaKey]?.type === "array") {
        if (newProps[schemaKey].items.type === "object") {
          // If it's an object, iterate each property and set
          //    all nested objects to empty object placeholders

          const newValue = value.map((item, n) => {
            const newItem = {};
            walkSchema(newProps[schemaKey].items, item, newItem, []);
            return newItem;
          });

          setValue(dest, path, newValue);
          value = newValue;
        }
      }

      // NOTE: after settings.color.palette is set in dest, settings.color
      //       gets set on top of what's already in dest, blowing away the sorting
      //       Can we just skip it if the value already exists?
      if (!getValue(dest, path)) {
        setValue(dest, path, value);
      }
    }
    path.pop();
  });

  extraKeys.forEach((key) => {
    path.push(key);
    if (!getValue(dest, path)) {
      setValue(dest, path, src[key]);
    }

    path.pop();
  });

  return dest;
}

export async function schemaSort(wpJsonObject, schema) {
  if (!schema) {
    throw new Error("schemaSort requires a schema.");
  }

  await $RefParser.dereference(schema);

  const newJsonObject = walkSchema(schema, wpJsonObject);

  return newJsonObject;
}
