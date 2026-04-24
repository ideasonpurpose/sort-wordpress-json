// @ts-check

import $RefParser from "@apidevtools/json-schema-ref-parser";

import getValue from "get-value";
import setValue from "set-value";

import { resolveProps } from "../lib/resolve-props.js";

/**
 * Filters override keys to those matching the current path level and extracts
 * the immediate keys (ignoring deeper nesting).
 * @param {string[]} overrides - Array of dot-path overrides
 * @param {string[]} path - Current path in the schema as an array, e.g., ['styles', 'blocks', 'color'].
 * @returns {string[]} Array of unique immediate keys matching this path.
 */
export function getOverrideKeys(overrides, path) {
  if (!overrides?.length || !path?.length) return [];

  const prefix = path.join(".") + ".";
  const keys = overrides
    .filter((k) => k.startsWith(prefix))
    .map((k) => {
      const remainder = k.slice(prefix.length);
      return remainder.includes(".") ? null : remainder;
    })
    .filter(Boolean);

  return [...new Set(keys)];
}

/**
 * Walks the schema and sorts the source object into the destination object.
 * @param {Object} schema - The JSON schema object.
 * @param {Record<string, any>} src - The source object to sort.
 * @param {Record<string, any>} [dest={}] - The destination object to populate.
 * @param {string[]} [path=[]] - The current path in the schema.
 * @param {string[]} [overrides=[]] - Array of override keys.
 * @returns {Record<string, any>} The sorted destination object.
 */
export function walkSchema(schema, src, dest = {}, path = [], overrides = []) {
  const schemaProps = resolveProps(schema.properties);

  const preOverrides = [];
  const postOverrides = [];

  for (const o of overrides) {
    if (o.startsWith("!")) {
      postOverrides.push(o.slice(1));
    } else {
      preOverrides.push(o);
    }
  }

  const schemaKeys = new Set([
    ...getOverrideKeys(preOverrides, path),
    ...Object.keys(schemaProps),
  ]);

  // reverse (mutate) postOverrides so they're resulting order matches intent
  // postOverrides.reverse();

  // if (getOverrideKeys(postOverrides, path).length) {
  //   console.log({
  //     postOverrides,
  //     getOverrideKeys: getOverrideKeys(postOverrides, path),
  //     path,
  //   });
  // }

  for (const key of getOverrideKeys(postOverrides, path)) {
    schemaKeys.delete(key);
    schemaKeys.add(key);
  }

  let extraKeys = [];
  if (!!src && !Array.isArray(src) && typeof src === "object") {
    extraKeys = Array.from(
      new Set(Object.keys(src)).difference(schemaKeys),
    ).sort();
  }

  schemaKeys.forEach((schemaKey) => {
    path.push(schemaKey);

    // Use path.length to cap recursion to an arbitrary 16 levels deep, just in case
    if (path.length > 16) {
      throw new Error("We're in too deep! Recursion maximum reached");
    }

    if (src[schemaKey] !== undefined) {
      walkSchema(schemaProps[schemaKey], src[schemaKey], dest, path, overrides);

      let value = src[schemaKey];
      /**
       * properties[key].type is not always specified for objects. This checks that the node
       * is not any known type besides object
       */
      if (schemaProps[schemaKey]?.type === "array") {
        if (schemaProps[schemaKey].items?.type === "object") {
          // If it's an object, iterate each property and set
          //    all nested objects to empty object placeholders

          const newValue = value.map((item, n) => {
            const newItem = {};
            walkSchema(schemaProps[schemaKey].items, item, newItem, []);
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

/**
 * Sorts a WordPress JSON object based on a given schema and overrides.
 * @param {Record<string, any>} wpJsonObject - The WordPress JSON object to sort.
 * @param {Object} schema - The JSON schema to use for sorting.
 * @param {string[]} [overrides=[]] - An array of override keys.
 * @returns {Promise<Record<string, any>>} The sorted JSON object.
 */
export async function schemaSort(wpJsonObject, schema, overrides = []) {
  if (!schema) {
    throw new Error("schemaSort requires a schema.");
  }

  await $RefParser.dereference(schema);

  const newJsonObject = walkSchema(schema, wpJsonObject, {}, [], overrides);
  return newJsonObject;
}
