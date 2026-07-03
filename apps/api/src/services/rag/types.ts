import type { QueryResponse, RetrievalFilters, RetrievalResult } from "@healthwise/shared";

export type QueryInput = {
  query: string;
  filters?: RetrievalFilters;
};

export type QueryEmbedder = {
  embed(query: string): Promise<number[]>;
};

export type AnswerGeneratorInput = {
  query: string;
  safetyLevel: QueryResponse["safetyLevel"];
  results: RetrievalResult[];
};

export type AnswerGenerator = {
  generate(input: AnswerGeneratorInput): Promise<string>;
};

export type Retriever = {
  search(input: {
    query: string;
    queryEmbedding?: number[];
    filters?: RetrievalFilters;
    topK?: number;
  }): Promise<RetrievalResult[]>;
};

export type RagQueryService = {
  answer(input: QueryInput): Promise<QueryResponse>;
};
