// @ts-check

/**
 * Recursively flattens JSON Schema composition arrays into a single
 * properties object.
 *
 * Traverses nested allOf/anyOf/oneOf entries and merges each node's
 * properties into one map. Later merges overwrite earlier keys.
 *
 * @param {Object} props - Accumulated properties from previous recursion.
 * @param {Array<any>|undefined} propSet - A composition array (allOf/anyOf/oneOf).
 * @returns {Object|undefined} Flattened properties, or the original non-array value.
 */
export function flattenProps(props, propSet) {
  if (!Array.isArray(propSet)) {
    return propSet;
  }

  let mergedProperties = { ...props };

  propSet.forEach((a) => {
    mergedProperties = {
      ...mergedProperties,
      ...flattenProps(mergedProperties, a.allOf),
      ...flattenProps(mergedProperties, a.anyOf),
      ...flattenProps(mergedProperties, a.oneOf),
    };

    mergedProperties = { ...mergedProperties, ...a.properties };
  });

  return mergedProperties;
}

/**
 * Resolves composed schema properties for each top-level schema key.
 *
 * For every entry in the provided object, this function merges direct
 * properties with flattened allOf/anyOf/oneOf branches and stores the
 * result on entry.properties.
 *
 * @param {Object} props - Schema object keyed by section name.
 * @returns {Object} A shallow copy with normalized properties on each section.
 */
export function resolveProps(props) {
  let resolvedProps = { ...props };

  const schemaKeys = Object.keys(resolvedProps);

  schemaKeys.forEach((key) => {
    let newProps = {
      ...resolvedProps[key]?.properties,
      ...flattenProps({}, resolvedProps[key].allOf),
      ...flattenProps({}, resolvedProps[key].anyOf),
      ...flattenProps({}, resolvedProps[key].oneOf),
    };

    resolvedProps[key].properties = newProps;
  });

  return resolvedProps;
}
