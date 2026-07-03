import type { Chunk, RetrievalFilters, VectorRecord } from "@healthwise/shared";

import { matchesFilters } from "./filters.js";
import type { BackendSearchResult, VectorSearchBackend, VectorSearchInput } from "./types.js";
import { cosineSimilarity } from "./vectorMath.js";

export class InMemoryVectorBackend implements VectorSearchBackend {
  private readonly chunksById: Map<string, Chunk>;

  constructor(
    chunks: Chunk[],
    private readonly vectors: VectorRecord[]
  ) {
    this.chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  }

  async search(input: VectorSearchInput): Promise<BackendSearchResult[]> {
    const scored = this.vectors
      .filter((vector) => this.matchesVectorFilters(vector, input.filters))
      .map((vector) => ({
        chunkId: vector.chunkId,
        score: cosineSimilarity(input.queryEmbedding, vector.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit);

    return scored.map((result, index) => ({
      ...result,
      rank: index + 1,
      source: "qdrant"
    }));
  }

  private matchesVectorFilters(vector: VectorRecord, filters?: RetrievalFilters): boolean {
    const chunk = this.chunksById.get(vector.chunkId);
    return Boolean(chunk && matchesFilters(chunk, filters));
  }
}
