import { describe, expect, it } from "vitest";

import { createLocalHybridRetriever } from "../apps/api/src/services/retrieval/createHybridRetriever.js";
import { loadRetrievalData } from "../apps/api/src/services/retrieval/loadRetrievalData.js";
import { cosineSimilarity } from "../apps/api/src/services/retrieval/vectorMath.js";

async function createRetrieverFixture() {
  const { chunks, vectors } = await loadRetrievalData();
  return {
    chunks,
    vectors,
    retriever: createLocalHybridRetriever(chunks, vectors)
  };
}

describe("retrieval math", () => {
  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("hybrid retrieval", () => {
  it("returns diabetes chunks for a type 2 diabetes symptoms query", async () => {
    const { chunks, vectors, retriever } = await createRetrieverFixture();
    const symptomChunk = chunks.find(
      (chunk) =>
        chunk.documentId === "medlineplus-type-2-diabetes" &&
        chunk.sectionHeading.toLowerCase().includes("symptoms")
    );
    expect(symptomChunk).toBeDefined();

    const queryEmbedding = vectors.find((vector) => vector.chunkId === symptomChunk?.id)?.embedding;
    expect(queryEmbedding).toBeDefined();

    const results = await retriever.search({
      query: "type 2 diabetes symptoms",
      queryEmbedding,
      topK: 5
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.topic === "diabetes")).toBe(true);
    expect(results[0]?.sourceUrl).toMatch(/^https:\/\//);
  });

  it("returns hypertension chunks for high blood pressure", async () => {
    const { chunks, vectors, retriever } = await createRetrieverFixture();
    const hypertensionChunk = chunks.find((chunk) => chunk.topic === "hypertension");
    expect(hypertensionChunk).toBeDefined();

    const queryEmbedding = vectors.find((vector) => vector.chunkId === hypertensionChunk?.id)?.embedding;
    expect(queryEmbedding).toBeDefined();

    const results = await retriever.search({
      query: "high blood pressure",
      queryEmbedding,
      topK: 5
    });

    expect(results.some((result) => result.topic === "hypertension")).toBe(true);
  });

  it("captures exact medication terms through keyword search", async () => {
    const { retriever } = await createRetrieverFixture();
    const results = await retriever.search({
      query: "ibuprofen",
      topK: 5
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.topic).toBe("medication-safety");
    expect(results[0]?.retrievalSources).toContain("solr");
  });

  it("can retrieve broad conceptual matches through vector search", async () => {
    const { chunks, vectors, retriever } = await createRetrieverFixture();
    const depressionChunk = chunks.find((chunk) => chunk.topic === "depression");
    expect(depressionChunk).toBeDefined();

    const queryEmbedding = vectors.find((vector) => vector.chunkId === depressionChunk?.id)?.embedding;
    expect(queryEmbedding).toBeDefined();

    const results = await retriever.search({
      query: "low mood and loss of interest",
      queryEmbedding,
      topK: 5
    });

    expect(results.some((result) => result.topic === "depression")).toBe(true);
    expect(results.some((result) => result.retrievalSources.includes("qdrant"))).toBe(true);
  });

  it("applies metadata filters and preserves citations", async () => {
    const { chunks, vectors, retriever } = await createRetrieverFixture();
    const diabetesChunk = chunks.find((chunk) => chunk.topic === "diabetes");
    expect(diabetesChunk).toBeDefined();

    const queryEmbedding = vectors.find((vector) => vector.chunkId === diabetesChunk?.id)?.embedding;
    expect(queryEmbedding).toBeDefined();

    const results = await retriever.search({
      query: "symptoms",
      queryEmbedding,
      filters: {
        topic: "diabetes"
      },
      topK: 5
    });

    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.topic).toBe("diabetes");
      expect(result.sourceName).toBeTruthy();
      expect(result.sourceUrl).toMatch(/^https:\/\//);
      expect(result.sectionHeading).toBeTruthy();
    }
  });
});
