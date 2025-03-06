import $RefParser from "@apidevtools/json-schema-ref-parser";

import getValue from "get-value";
import setValue from "set-value";
// import { getSchema } from "..";

// TODO: Everything we care about has to have a "properties" key. If it doesn't, it
// probably has an "allOf" key. Check for allOf first, then deep-merge that onto
// an existing properties, or create an empty properties.

export function walkSchema(schema, src, dest = {}, path = []) {
  if (schema.allOf) {
    const newProps = schema.allOf.reduce(
      (prev, curr) => ({ ...prev, ...curr.properties }),
      { ...schema.properties }
    );
    schema.properties = newProps;
  }

  const keys = Object.keys(schema.properties ?? {});

  let extraKeys = [];
  if (typeof src === "object") {
    extraKeys = Array.from(
      new Set(Object.keys(src)).difference(new Set(keys))
    ).sort();
  }
  // console.log({ extraKeys });

  keys.forEach((key) => {
    path.push(key);

    // Use path.length to cap recursion to an arbitrary 16 levels deep, just in case
    if (path.length > 16) {
      throw new Error("We're in too deep! Recursion maximum reached");
    }

    // console.log("recursing", path.length, "levels deep!");

    if (src[key] !== undefined) {
      /**
       * properties[key].type is not always specified for objects. This checks that the node
       * is not any known type besides object
       */
      const nodeType = schema.properties[key]?.type;

      // if (schema.properties[key]?.type === "object") {
      if (!["array", "boolean", "integer", "string"].includes(nodeType)) {
        if (schema.properties[key].allOf) {
          schema.properties[key].allOf.forEach((n) =>
            // TODO: I don't think the fallback empty object ever get's hit?
            // walkSchema(n, src[key] ?? {}, dest, path)
            walkSchema(n, src[key], dest, path)
          );
        } else if (schema.properties[key].oneOf) {
          schema.properties[key].oneOf.forEach((n) => {
            // TODO: same as above, I don't think the fallback empty object ever get's hit?
            // walkSchema(n, src[key] ?? {}, dest, path)
            // console.log({ "ONEOF schema": n, key, src: src[key], path });
            return walkSchema(n, src[key], dest, path);
          });
        } else {
          // TODO: same as above, I don't think the fallback empty object ever get's hit?
          // walkSchema(schema.properties[key], src[key] ?? {}, dest, path);
          walkSchema(schema.properties[key], src[key], dest, path);
        }
      }

      // if (schema.properties[key].oneOf) {
      //   schema.properties[key].oneOf.forEach((n) =>
      //     // TODO: same as above, I don't think the fallback empty object ever get's hit?
      //     // walkSchema(n, src[key] ?? {}, dest, path)
      //     walkSchema(n, src[key], dest, path)
      //   );
      // }

      let value = src[key];
      if (schema.properties[key]?.type === "array") {
        if (schema.properties[key].items.type === "object") {
          // TODO: Is this whole clause a leftover?
          // console.log('ARRAY OBJECT', schema.properties[key].items, value)

          const newValue = value.map((item, n) => {
            const newItem = {};
            walkSchema(schema.properties[key].items, item, newItem, []);
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

  // console.log({ wpJsonObject, newJsonObject });
  return newJsonObject;
}
