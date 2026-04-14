// @ts-check

/**
 * This helper splits a list of key-paths into two arrays of split paths.
 * Input keys will look like "settings.advanced" or "!settings.color.presets".
 * First, split the keys based on whether their first character is an
 * exclamation point. Next, return each keypath as an array of split parts:
 *    "settings.advanced" => ["settings", "advanced"]
 *    "!settings.color.presets" => ["settings", "color", "presets"]
 * Return a two index array of arrays.
 */
export function parseKeyPaths(keyPaths) {
  const positive = [];
  const negative = [];

  for (const path of keyPaths) {
    if (path.startsWith("!")) {
      negative.push(path.slice(1).split("."));
    } else {
      positive.push(path.split("."));
    }
  }

  return [positive, negative];
}
