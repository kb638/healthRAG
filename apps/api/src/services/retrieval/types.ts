import type { RetrievalFilters, RetrievalSource } from "@healthwise/shared";

export type BackendSearchResult = {
  chunkId: string;
  score: number;
  rank: number;
  source: RetrievalSource;
};

export type VectorSearchInput = {
  queryEmbedding: number[];
  filters?: RetrievalFilters;
  limit: number;
};

export type KeywordSearchInput = {
  query: string;
  filters?: RetrievalFilters;
  limit: number;
};

export type VectorSearchBackend = {
  search(input: VectorSearchInput): Promise<BackendSearchResult[]>;
};

export type KeywordSearchBackend = {
  search(input: KeywordSearchInput): Promise<BackendSearchResult[]>;
};
