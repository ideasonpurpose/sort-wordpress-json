import { cacheSchemas } from "../lib/cache-schemas.js";
import { schemaUrls } from "../defaults/schemas.js";

await cacheSchemas(schemaUrls);
