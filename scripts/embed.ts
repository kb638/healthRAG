import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import OpenAI from "openai";

import type { Chunk, QdrantPoint, SolrDocument, VectorRecord } from "@healthwise/shared";

const rootDir = process.cwd();
const chunksPath = resolve(rootDir, "data/processed/chunks.json");
const embeddingCachePath = resolve(rootDir, "data/indexes/embedding-cache.json");
const qdrantPointsPath = resolve(rootDir, "data/indexes/qdrant-points.json");
const solrDocumentsPath = resolve(rootDir, "data/indexes/solr-documents.json");

const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const batchSize = 32;

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to .env, then run npm run embed to generate embeddings."
    );
  }

  const chunks = await readChunks();
  const existingCache = await readEmbeddingCache();
  const cacheByChunkId = new Map(existingCache.map((record) => [record.chunkId, record]));
  const nextCache: VectorRecord[] = [];
  const chunksToEmbed: Chunk[] = [];

  for (const chunk of chunks) {
    const textHash = hashText(chunk.text);
    const cached = cacheByChunkId.get(chunk.id);

    if (
      cached &&
      cached.textHash === textHash &&
      cached.embeddingModel === embeddingModel &&
      cached.embedding.length > 0
    ) {
      nextCache.push(cached);
      continue;
    }

    chunksToEmbed.push(chunk);
  }

  if (chunksToEmbed.length > 0) {
    console.log(`Embedding ${chunksToEmbed.length} changed or missing chunks with ${embeddingModel}`);
    const client = new OpenAI();

    for (let index = 0; index < chunksToEmbed.length; index += batchSize) {
      const batch = chunksToEmbed.slice(index, index + batchSize);
      const response = await client.embeddings.create({
        model: embeddingModel,
        input: batch.map((chunk) => chunk.text)
      });

      for (const [embeddingIndex, item] of response.data.entries()) {
        const chunk = batch[embeddingIndex];

        if (!chunk) {
          throw new Error("OpenAI returned more embeddings than requested");
        }

        nextCache.push({
          chunkId: chunk.id,
          textHash: hashText(chunk.text),
          embeddingModel,
          embedding: item.embedding,
          embeddedAt: new Date().toISOString()
        });
      }
    }
  } else {
    console.log("Embedding cache is up to date; no OpenAI calls needed");
  }

  sortCache(nextCache);
  validateEmbeddingCache(chunks, nextCache);

  const qdrantPoints = createQdrantPoints(chunks, nextCache);
  const solrDocuments = createSolrDocuments(chunks);

  await writeJson(embeddingCachePath, nextCache);
  await writeJson(qdrantPointsPath, qdrantPoints);
  await writeJson(solrDocumentsPath, solrDocuments);

  console.log(`Wrote ${nextCache.length} embeddings to ${embeddingCachePath}`);
  console.log(`Wrote ${qdrantPoints.length} Qdrant-ready points to ${qdrantPointsPath}`);
  console.log(`Wrote ${solrDocuments.length} Solr-ready documents to ${solrDocumentsPath}`);
}

async function readChunks(): Promise<Chunk[]> {
  const raw = await readFile(chunksPath, "utf8");
  const chunks = JSON.parse(raw) as Chunk[];

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("Expected data/processed/chunks.json to contain chunks. Run npm run chunk first.");
  }

  return chunks;
}

async function readEmbeddingCache(): Promise<VectorRecord[]> {
  try {
    const raw = await readFile(embeddingCachePath, "utf8");
    const cache = JSON.parse(raw) as VectorRecord[];

    return Array.isArray(cache) ? cache : [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

function createQdrantPoints(chunks: Chunk[], cache: VectorRecord[]): QdrantPoint[] {
  const cacheByChunkId = new Map(cache.map((record) => [record.chunkId, record]));

  return chunks.map((chunk) => {
    const vectorRecord = cacheByChunkId.get(chunk.id);

    if (!vectorRecord) {
      throw new Error(`Missing embedding for chunk ${chunk.id}`);
    }

    return {
      id: stablePointId(chunk.id),
      vector: vectorRecord.embedding,
      payload: {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        title: chunk.title,
        sourceName: chunk.sourceName,
        sourceUrl: chunk.sourceUrl,
        topic: chunk.topic,
        sectionHeading: chunk.sectionHeading,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        accessedAt: chunk.accessedAt,
        textHash: vectorRecord.textHash,
        embeddingModel: vectorRecord.embeddingModel
      }
    };
  });
}

function createSolrDocuments(chunks: Chunk[]): SolrDocument[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    chunkId: chunk.id,
    documentId: chunk.documentId,
    title: chunk.title,
    sourceName: chunk.sourceName,
    sourceUrl: chunk.sourceUrl,
    topic: chunk.topic,
    sectionHeading: chunk.sectionHeading,
    chunkIndex: chunk.chunkIndex,
    text: chunk.text,
    tokenCount: chunk.tokenCount,
    accessedAt: chunk.accessedAt
  }));
}

function validateEmbeddingCache(chunks: Chunk[], cache: VectorRecord[]) {
  const chunkIds = new Set(chunks.map((chunk) => chunk.id));
  const seen = new Set<string>();

  if (cache.length !== chunks.length) {
    throw new Error(`Expected ${chunks.length} cached embeddings, found ${cache.length}`);
  }

  for (const record of cache) {
    if (!chunkIds.has(record.chunkId)) {
      throw new Error(`Embedding cache contains unknown chunk ${record.chunkId}`);
    }

    if (seen.has(record.chunkId)) {
      throw new Error(`Embedding cache contains duplicate chunk ${record.chunkId}`);
    }

    if (!record.textHash || !record.embeddingModel || record.embedding.length === 0) {
      throw new Error(`Embedding cache record for ${record.chunkId} is incomplete`);
    }

    seen.add(record.chunkId);
  }
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function stablePointId(chunkId: string): string {
  const hex = createHash("sha1").update(chunkId).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function sortCache(cache: VectorRecord[]) {
  cache.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
