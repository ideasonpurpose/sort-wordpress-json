// @ts-check

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param {Object} wpJsonObject A parsed JSON file, will be checked for a "$schema" key
 * @param {string} wpJsonFilename Optional filepath used to check for a local schema file
 * @param {(wpJsonFilename: string) => string | null} localSchema Dependency injection for testing
 * NOTE: json-schema-ref-parser handles loading from a url or filepath
 */
export async function getSchema(
  wpJsonObject = {},
  wpJsonFilename = "",
  localSchema = getLocalSchemaPath,
) {
  try {
    const remoteSchemaUrl = wpJsonObject["$schema"];
    return await $RefParser.bundle(remoteSchemaUrl);
  } catch (error) {
    console.error("Unable to load remote schema file. Falling back to local.");
  }

  if (wpJsonFilename) {
    try {
      console.log("Trying fallback schema");
      const localSchemaPath = localSchema(wpJsonFilename);
      if (!localSchemaPath) {
        console.error("No local schema path found.");
        return false;
      }
      return await $RefParser.bundle(localSchemaPath);
    } catch (error) {
      console.error("Unable to load fallback schema file.");
    }
  }

  return false;
}

export function getLocalSchemaPath(wpJsonFilename) {
  const filename = wpJsonFilename.split("/").pop();
  const schemaFile = join(__dirname, "../schema", filename);
  if (existsSync(schemaFile)) {
    return schemaFile;
  }
  return null;
}
