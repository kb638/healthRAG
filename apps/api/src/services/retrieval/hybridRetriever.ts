import type { Chunk, RetrievalRequest, RetrievalResult } from "@healthwise/shared";

import { matchesFilters } from "./filters.js";
import type {
  BackendSearchResult,
  KeywordSearchBackend,
  VectorSearchBackend
} from "./types.js";

type HybridRetrieverOptions = {
  chunks: Chunk[];
  vectorBackend: VectorSearchBackend;
  keywordBackend: KeywordSearchBackend;
  rrfK?: number;
  backendLimit?: number;
};

type Accumulator = {
  chunk: Chunk;
  vectorScore?: number;
  keywordScore?: number;
  vectorRank?: number;
  keywordRank?: number;
  rrfScore: number;
  retrievalSources: Set<"qdrant" | "solr">;
};

export class HybridRetriever {
  private readonly chunksById: Map<string, Chunk>;
  private readonly rrfK: number;
  private readonly backendLimit: number;
  private readonly vectorBackend: VectorSearchBackend;
  private readonly keywordBackend: KeywordSearchBackend;

  constructor(options: HybridRetrieverOptions) {
    this.chunksById = new Map(options.chunks.map((chunk) => [chunk.id, chunk]));
    this.vectorBackend = options.vectorBackend;
    this.keywordBackend = options.keywordBackend;
    this.rrfK = options.rrfK ?? 60;
    this.backendLimit = options.backendLimit ?? 20;
  }

  async search(request: RetrievalRequest): Promise<RetrievalResult[]> {
    const topK = request.topK ?? 6;
    const backendLimit = Math.max(this.backendLimit, topK * 3);

    const [vectorResults, keywordResults] = await Promise.all([
      request.queryEmbedding
        ? this.vectorBackend.search({
            queryEmbedding: request.queryEmbedding,
            filters: request.filters,
            limit: backendLimit
          })
        : Promise.resolve([]),
      this.keywordBackend.search({
        query: request.query,
        filters: request.filters,
        limit: backendLimit
      })
    ]);

    const accumulators = new Map<string, Accumulator>();

    this.addResults(accumulators, vectorResults);
    this.addResults(accumulators, keywordResults);

    return Array.from(accumulators.values())
      .filter((value) => matchesFilters(value.chunk, request.filters))
      .map((value) => toRetrievalResult(value))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK);
  }

  private addResults(accumulators: Map<string, Accumulator>, results: BackendSearchResult[]) {
    for (const result of results) {
      const chunk = this.chunksById.get(result.chunkId);

      if (!chunk) {
        continue;
      }

      const current =
        accumulators.get(result.chunkId) ??
        ({
          chunk,
          rrfScore: 0,
          retrievalSources: new Set()
        } satisfies Accumulator);

      current.rrfScore += 1 / (this.rrfK + result.rank);
      current.retrievalSources.add(result.source);

      if (result.source === "qdrant") {
        current.vectorScore = result.score;
        current.vectorRank = result.rank;
      } else {
        current.keywordScore = result.score;
        current.keywordRank = result.rank;
      }

      accumulators.set(result.chunkId, current);
    }
  }
}

function toRetrievalResult(value: Accumulator): RetrievalResult {
  return {
    chunkId: value.chunk.id,
    documentId: value.chunk.documentId,
    title: value.chunk.title,
    sectionHeading: value.chunk.sectionHeading,
    sourceName: value.chunk.sourceName,
    sourceUrl: value.chunk.sourceUrl,
    topic: value.chunk.topic,
    text: value.chunk.text,
    tokenCount: value.chunk.tokenCount,
    accessedAt: value.chunk.accessedAt,
    vectorScore: value.vectorScore,
    keywordScore: value.keywordScore,
    vectorRank: value.vectorRank,
    keywordRank: value.keywordRank,
    rrfScore: value.rrfScore,
    finalScore: value.rrfScore,
    retrievalSources: Array.from(value.retrievalSources)
  };
}
