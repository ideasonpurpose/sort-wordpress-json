// @ts-check

import $RefParser from "@apidevtools/json-schema-ref-parser";

import getValue from "get-value";
import setValue from "set-value";

import { resolveProps } from "../lib/resolve-props.js";

/**
 * Filter on path and remove non-overlapping override entries
 * then extract all overlapping bits of the path and return
 * only a list of keys relevant to the current level.
 * @param {Array} overrides Like ['settings.layout', 'settings.color.default']
 * @param {Array} path something like ['styles', 'blocks', 'color']
 */
export function getOverrideKeys(overrides, path) {
  const dotPath = path.join(".") + ".";
  return Array.from(
    new Set(
      overrides
        .filter((key) => key.startsWith(dotPath))
        .map((key) => key.slice(dotPath.length).split(".")[0])
    )
  );
}

// TODO: Possibly build in overrides for unconsidered schema order
// const sortProperties = ["styles.blocks", "styles.elements"];

export function walkSchema(schema, src, dest = {}, path = [], overrides = []) {
  const schemaProps = resolveProps(schema.properties);

  // TODO: Somewhere in here we need to replace the existing object with the new one since
  // the existing object was cloned with all properties, and those existing properties are
  // sticking which prevents re-sorting.

  // TODO: Some values can be null, which fails here because
  //       `Object.keys(null)` throws an error. What should happen
  //       here if src is null?
  //
  //       srcKeys can move inside the following conditional
  //       since that's already checking for Object-ness, it
  //       should prevent calling Object.keys on non-Object
  //       stuff.
  //       Annoying detail: `typeof null` returns 'object'
  //
  // TODO: If there's nothing to iterate on src, should we just return?

  // const overrideKeys = []; // ['styles', 'layout'];
  // const overrideKeys = Object.keys(overrides);
  // console.log({ path: path.join('.'), overrides });
  // console.log({ path, overrides });
  // const schemaKeys = [...overrideKeys, ...Object.keys(schemaProps)];
  const schemaKeys = [
    ...getOverrideKeys(overrides, path),
    ...Object.keys(schemaProps),
  ];
  let extraKeys = [];
  if (!!src && !Array.isArray(src) && typeof src === "object") {
    extraKeys = Array.from(
      new Set(Object.keys(src)).difference(new Set(schemaKeys))
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
      // const nodeType = newProps[schemaKey]?.type;

      // TODO: SOME Arrays should be sorted alphabetically.
      //       Arrays like colors should remain in authored order.

      walkSchema(schemaProps[schemaKey], src[schemaKey], dest, path, overrides);

      let value = src[schemaKey];
      if (schemaProps[schemaKey]?.type === "array") {
        if (schemaProps[schemaKey].items.type === "object") {
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

// TODO: Extract the schema from the file if there's a "$schema" key

export async function schemaSort(wpJsonObject, schema, overrides = []) {
  if (!schema) {
    throw new Error("schemaSort requires a schema.");
  }

  await $RefParser.dereference(schema);

  const newJsonObject = walkSchema(schema, wpJsonObject, {}, [], overrides);

  return newJsonObject;
}
