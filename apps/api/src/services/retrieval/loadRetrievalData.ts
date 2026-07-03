import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Chunk, VectorRecord } from "@healthwise/shared";

import { findProjectRoot } from "../../utils/paths.js";

export type RetrievalData = {
  chunks: Chunk[];
  vectors: VectorRecord[];
};

export async function loadRetrievalData(rootDir = findProjectRoot()): Promise<RetrievalData> {
  const chunksPath = resolve(rootDir, "data/processed/chunks.json");
  const vectorsPath = resolve(rootDir, "data/indexes/embedding-cache.json");

  const [chunksRaw, vectorsRaw] = await Promise.all([
    readFile(chunksPath, "utf8"),
    readFile(vectorsPath, "utf8")
  ]);

  const chunks = JSON.parse(chunksRaw) as Chunk[];
  const vectors = JSON.parse(vectorsRaw) as VectorRecord[];

  validateRetrievalData(chunks, vectors);

  return { chunks, vectors };
}

export function validateRetrievalData(chunks: Chunk[], vectors: VectorRecord[]) {
  const chunkIds = new Set(chunks.map((chunk) => chunk.id));

  if (chunks.length === 0) {
    throw new Error("Expected at least one chunk");
  }

  if (vectors.length !== chunks.length) {
    throw new Error(`Expected ${chunks.length} vectors, found ${vectors.length}`);
  }

  for (const vector of vectors) {
    if (!chunkIds.has(vector.chunkId)) {
      throw new Error(`Vector references unknown chunk ${vector.chunkId}`);
    }

    if (vector.embedding.length === 0) {
      throw new Error(`Vector for ${vector.chunkId} is empty`);
    }
  }
}

export function createChunkMap(chunks: Chunk[]): Map<string, Chunk> {
  return new Map(chunks.map((chunk) => [chunk.id, chunk]));
}
