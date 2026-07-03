import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const qdrantUrl = process.env.QDRANT_URL ?? "http://localhost:6333";
const collection = process.env.QDRANT_COLLECTION ?? "healthwise_chunks";
const embeddingCachePath = resolve(process.cwd(), "data/indexes/embedding-cache.json");

async function main() {
  const vectorSize = await detectVectorSize();
  const collectionUrl = `${qdrantUrl}/collections/${collection}`;
  const existing = await fetch(collectionUrl);

  if (existing.ok) {
    console.log(`Qdrant collection already exists: ${collection}`);
    return;
  }

  if (existing.status !== 404) {
    throw new Error(`Qdrant collection check failed: ${existing.status} ${await existing.text()}`);
  }

  const response = await fetch(collectionUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      vectors: {
        size: vectorSize,
        distance: "Cosine"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Qdrant collection setup failed: ${response.status} ${await response.text()}`);
  }

  console.log(`Created Qdrant collection ${collection} with vector size ${vectorSize}`);
}

async function detectVectorSize(): Promise<number> {
  const raw = await readFile(embeddingCachePath, "utf8");
  const cache = JSON.parse(raw) as Array<{ embedding: number[] }>;
  const vectorSize = cache[0]?.embedding.length;

  if (!vectorSize) {
    throw new Error("Could not detect vector size from data/indexes/embedding-cache.json");
  }

  return vectorSize;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
