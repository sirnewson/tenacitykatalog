import { readFile, writeFile } from "node:fs/promises";

const products = JSON.parse(await readFile(new URL("../data/products.json", import.meta.url), "utf8"));
const sections = JSON.parse(await readFile(new URL("../data/sections.json", import.meta.url), "utf8"));
const publicProducts = products.map(({ source_path, photo_path, notes, ...product }) => ({
  ...product,
  image_url: `/assets/img/${product.id}.jpg`,
}));

await writeFile(
  new URL("../public/catalog.json", import.meta.url),
  JSON.stringify({
    schema_version: "2.0",
    generated_from: "data/products.json",
    brand: "Tenacity Locks Ltd",
    currency: "KES",
    contact: sections.contact,
    collections: sections.collections,
    products: publicProducts,
  }, null, 2),
  "utf8",
);
