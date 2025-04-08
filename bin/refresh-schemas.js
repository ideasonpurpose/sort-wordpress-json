import { writeFile } from "fs/promises";
import { basename } from "path";

const schemas = [
  "https://schemas.wp.org/trunk/theme.json",
  "https://schemas.wp.org/trunk/block.json",
  "https://schemas.wp.org/trunk/font-collection.json",
];

async function downloadSchema(schemaUrl) {
  const schemaName = basename(schemaUrl);
  console.log("downloading", schemaUrl);

  const response = await fetch(schemaUrl);
  if (!response.ok) {
    throw new Error(
      `HTTP Error: (${response.status}) while fetching ${schemaUrl}`
    );
  }

  const rawData = await response.text();

  await writeFile(`./schema/${schemaName}`, rawData);
  console.log("successfully downloaded", schemaName);
}

await Promise.all(schemas.map(async (s) => await downloadSchema(s)));
