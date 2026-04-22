import { cacheSchemas } from "../lib/cache.js";
import { schemaUrls } from "../lib/schemas.js";

await cacheSchemas(schemaUrls);
