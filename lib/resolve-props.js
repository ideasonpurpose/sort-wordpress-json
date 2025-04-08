/**
 * Recursive helper for resolveProps
 */
export function flattenProps(props, propSet) {
  if (!Array.isArray(propSet)) {
    return propSet;
  }

  let mergedProperties = { ...props };

  propSet.forEach((a) => {
    mergedProperties = {
      ...mergedProperties,
      ...flattenProps(mergedProperties, a?.allOf),
      ...flattenProps(mergedProperties, a?.anyOf),
      ...flattenProps(mergedProperties, a?.oneOf),
    };

    mergedProperties = { ...mergedProperties, ...a.properties };
  });

  return mergedProperties;
}

/**
 * Send this a properties object
 */
export function resolveProps(props) {
  let resolvedProps = { ...props };

  const schemaKeys = Object.keys(resolvedProps);

  schemaKeys.forEach((key) => {
    let newProps = { ...resolvedProps[key]?.properties }; // almost certainly empty

    if (resolvedProps[key].allOf) {
      newProps = { ...flattenProps({ ...newProps }, resolvedProps[key].allOf) };
    }

    if (resolvedProps[key].anyOf) {
      newProps = { ...flattenProps({ ...newProps }, resolvedProps[key].anyOf) };
    }

    if (resolvedProps[key].oneOf) {
      newProps = { ...flattenProps({ ...newProps }, resolvedProps[key].oneOf) };
    }
    // console.log({ newProps: Object.keys(newProps) });
    resolvedProps[key].properties = newProps;
  });

  return resolvedProps;
}
