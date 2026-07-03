import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEncoding } from "js-tiktoken";

import type { Chunk, NormalizedDocument } from "@healthwise/shared";

const rootDir = process.cwd();
const documentsPath = resolve(rootDir, "data/processed/documents.json");
const chunksPath = resolve(rootDir, "data/processed/chunks.json");

const targetChunkTokens = 650;
const chunkOverlapTokens = 100;
const maxChunkTokens = 850;

const encoding = getEncoding("cl100k_base");

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: targetChunkTokens * 4,
  chunkOverlap: chunkOverlapTokens * 4,
  separators: ["\n\n", "\n", ". ", "; ", ", ", " ", ""]
});

async function main() {
  const documents = await readDocuments();
  const chunks = await chunkDocuments(documents);

  validateChunks(chunks);

  await mkdir(dirname(chunksPath), { recursive: true });
  await writeFile(chunksPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");

  console.log(`Wrote ${chunks.length} chunks to ${chunksPath}`);
}

async function readDocuments(): Promise<NormalizedDocument[]> {
  const raw = await readFile(documentsPath, "utf8");
  const documents = JSON.parse(raw) as NormalizedDocument[];

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("Expected data/processed/documents.json to contain documents");
  }

  return documents;
}

async function chunkDocuments(documents: NormalizedDocument[]): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  for (const document of documents) {
    let chunkIndex = 0;

    for (const section of document.sections) {
      const sectionText = normalizeChunkText(section.text);

      if (!sectionText) {
        continue;
      }

      const splitTexts = await splitSection(sectionText);

      for (const text of splitTexts) {
        const tokenCount = countTokens(text);

        chunks.push({
          id: `${document.id}__${slugify(section.heading)}__${chunkIndex}`,
          documentId: document.id,
          title: document.title,
          sourceName: document.sourceName,
          sourceUrl: document.sourceUrl,
          topic: document.topic,
          sectionHeading: section.heading,
          chunkIndex,
          text,
          tokenCount,
          accessedAt: document.accessedAt
        });

        chunkIndex += 1;
      }
    }
  }

  return chunks;
}

async function splitSection(text: string): Promise<string[]> {
  const tokenCount = countTokens(text);

  if (tokenCount <= maxChunkTokens) {
    return [text];
  }

  const splitTexts = await splitter.splitText(text);
  const normalized = splitTexts.map(normalizeChunkText).filter(Boolean);

  return mergeSmallChunks(normalized);
}

function mergeSmallChunks(texts: string[]): string[] {
  const merged: string[] = [];
  let buffer = "";

  for (const text of texts) {
    if (!buffer) {
      buffer = text;
      continue;
    }

    const combined = `${buffer}\n${text}`;

    if (countTokens(buffer) < 220 && countTokens(combined) <= maxChunkTokens) {
      buffer = combined;
      continue;
    }

    merged.push(buffer);
    buffer = text;
  }

  if (buffer) {
    merged.push(buffer);
  }

  return merged;
}

function validateChunks(chunks: Chunk[]) {
  const ids = new Set<string>();

  if (chunks.length === 0) {
    throw new Error("Chunking produced no chunks");
  }

  for (const chunk of chunks) {
    if (ids.has(chunk.id)) {
      throw new Error(`Duplicate chunk id: ${chunk.id}`);
    }

    ids.add(chunk.id);

    if (
      !chunk.documentId ||
      !chunk.title ||
      !chunk.sourceName ||
      !chunk.sourceUrl ||
      !chunk.topic ||
      !chunk.sectionHeading ||
      !chunk.text ||
      !chunk.accessedAt
    ) {
      throw new Error(`Chunk ${chunk.id} is missing required metadata`);
    }

    if (chunk.tokenCount !== countTokens(chunk.text)) {
      throw new Error(`Chunk ${chunk.id} has an incorrect token count`);
    }

    if (chunk.tokenCount > maxChunkTokens + 50) {
      throw new Error(`Chunk ${chunk.id} is too large: ${chunk.tokenCount} tokens`);
    }
  }
}

function normalizeChunkText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countTokens(text: string): number {
  return encoding.encode(text).length;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
