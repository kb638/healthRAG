import type { RetrievalFilters } from "@healthwise/shared";

import type { BackendSearchResult, VectorSearchBackend, VectorSearchInput } from "./types.js";

type QdrantPointSearchResult = {
  id: string | number;
  score: number;
  payload?: {
    chunkId?: string;
  };
};

type QdrantSearchResponse = {
  result?: QdrantPointSearchResult[];
};

export class QdrantVectorBackend implements VectorSearchBackend {
  constructor(
    private readonly url: string,
    private readonly collection: string
  ) {}

  async search(input: VectorSearchInput): Promise<BackendSearchResult[]> {
    const response = await fetch(`${this.url}/collections/${this.collection}/points/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vector: input.queryEmbedding,
        limit: input.limit,
        with_payload: ["chunkId"],
        filter: createQdrantFilter(input.filters)
      })
    });

    if (!response.ok) {
      throw new Error(`Qdrant search failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as QdrantSearchResponse;

    return (body.result ?? []).map((point, index) => ({
      chunkId: point.payload?.chunkId ?? String(point.id),
      score: point.score,
      rank: index + 1,
      source: "qdrant"
    }));
  }
}

export function createQdrantFilter(filters: RetrievalFilters = {}) {
  const must: unknown[] = [];

  if (filters.topic) {
    must.push({
      key: "topic",
      match: {
        value: filters.topic
      }
    });
  }

  if (filters.sourceName) {
    must.push({
      key: "sourceName",
      match: {
        value: filters.sourceName
      }
    });
  }

  return must.length > 0 ? { must } : undefined;
}
