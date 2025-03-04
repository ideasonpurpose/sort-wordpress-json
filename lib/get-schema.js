import $RefParser from "@apidevtools/json-schema-ref-parser";

/**
 *
 * @param {Object} wpJsonObject A parsed JSON file, will be checked for a "$schema" key
 *
 * NOTE: json-schema-ref-parser handles loading from a url or filepath
 */
export async function getSchema(wpJsonObject = {}) {
  let schema;
  const remoteSchemaUrl = wpJsonObject["$schema"];
  const localSchemaPath = "schema/theme.json";

  if (remoteSchemaUrl) {
    try {
      schema = await $RefParser.bundle(remoteSchemaUrl);
    } catch (error) {
      console.error(
        "Unable to load remote schema file. Falling back to local.",
        error
      );
    }
  }

  if (!schema) {
    // load from local file
    schema = await $RefParser.bundle(localSchemaPath);
  }

  return schema;
}
