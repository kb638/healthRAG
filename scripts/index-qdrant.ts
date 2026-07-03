import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { QdrantPoint } from "@healthwise/shared";

const qdrantUrl = process.env.QDRANT_URL ?? "http://localhost:6333";
const collection = process.env.QDRANT_COLLECTION ?? "healthwise_chunks";
const qdrantPointsPath = resolve(process.cwd(), "data/indexes/qdrant-points.json");
const batchSize = 64;

async function main() {
  const points = await readQdrantPoints();

  for (let index = 0; index < points.length; index += batchSize) {
    const batch = points.slice(index, index + batchSize);
    const response = await fetch(
      `${qdrantUrl}/collections/${collection}/points?wait=true`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          points: batch.map((point) => ({
            id: point.id,
            vector: point.vector,
            payload: point.payload
          }))
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Qdrant upsert failed: ${response.status} ${await response.text()}`);
    }
  }

  console.log(`Upserted ${points.length} points into Qdrant collection ${collection}`);
}

async function readQdrantPoints(): Promise<QdrantPoint[]> {
  const raw = await readFile(qdrantPointsPath, "utf8");
  const points = JSON.parse(raw) as QdrantPoint[];

  if (!Array.isArray(points) || points.length === 0) {
    throw new Error("Expected data/indexes/qdrant-points.json to contain points");
  }

  for (const point of points) {
    if (!isUuid(point.id)) {
      throw new Error(`Qdrant point id must be a UUID: ${point.id}`);
    }
  }

  return points;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
