import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { Chunk } from "@healthwise/shared";

const chunksPath = resolve(process.cwd(), "data/processed/chunks.json");
const embeddingCachePath = resolve(process.cwd(), "data/indexes/embedding-cache.json");

async function readChunks(): Promise<Chunk[]> {
  return JSON.parse(await readFile(chunksPath, "utf8")) as Chunk[];
}

describe("chunking output", () => {
  it("creates unique chunk ids", async () => {
    const chunks = await readChunks();
    const ids = new Set(chunks.map((chunk) => chunk.id));

    expect(chunks.length).toBeGreaterThan(0);
    expect(ids.size).toBe(chunks.length);
  });

  it("preserves source metadata on every chunk", async () => {
    const chunks = await readChunks();

    for (const chunk of chunks) {
      expect(chunk.documentId).toBeTruthy();
      expect(chunk.title).toBeTruthy();
      expect(chunk.sourceName).toBeTruthy();
      expect(chunk.sourceUrl).toMatch(/^https:\/\//);
      expect(chunk.topic).toBeTruthy();
      expect(chunk.sectionHeading).toBeTruthy();
      expect(chunk.accessedAt).toBeTruthy();
    }
  });

  it("keeps chunks non-empty and within target range where possible", async () => {
    const chunks = await readChunks();

    for (const chunk of chunks) {
      expect(chunk.text.trim().length).toBeGreaterThan(0);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.tokenCount).toBeLessThanOrEqual(900);
    }
  });
});

describe("embedding cache output", () => {
  it("maps one cached embedding to each chunk when the cache exists", async () => {
    let cacheText: string;

    try {
      cacheText = await readFile(embeddingCachePath, "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return;
      }

      throw error;
    }

    const chunks = await readChunks();
    const cache = JSON.parse(cacheText) as Array<{ chunkId: string; embedding: number[] }>;
    const chunkIds = new Set(chunks.map((chunk) => chunk.id));

    expect(cache).toHaveLength(chunks.length);

    for (const record of cache) {
      expect(chunkIds.has(record.chunkId)).toBe(true);
      expect(record.embedding.length).toBeGreaterThan(0);
    }
  });
});
