export type HealthResponse = {
  status: "ok";
  service: "healthwise-rag-api";
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type SourceMetadata = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  contentType: "html";
  accessedAt: string;
  trustLevel: "public-medical-source";
};

export type DocumentSection = {
  heading: string;
  text: string;
};

export type NormalizedDocument = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  accessedAt: string;
  sections: DocumentSection[];
};

export type Chunk = {
  id: string;
  documentId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  sectionHeading: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  accessedAt: string;
};

export type VectorRecord = {
  chunkId: string;
  textHash: string;
  embeddingModel: string;
  embedding: number[];
  embeddedAt: string;
};

export type QdrantPoint = {
  id: string;
  vector: number[];
  payload: {
    chunkId: string;
    documentId: string;
    title: string;
    sourceName: string;
    sourceUrl: string;
    topic: string;
    sectionHeading: string;
    chunkIndex: number;
    text: string;
    tokenCount: number;
    accessedAt: string;
    textHash: string;
    embeddingModel: string;
  };
};

export type SolrDocument = {
  id: string;
  chunkId: string;
  documentId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  sectionHeading: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  accessedAt: string;
};

export type RetrievalFilters = {
  topic?: string;
  sourceName?: string;
};

export type RetrievalSource = "qdrant" | "solr";

export type RetrievalResult = {
  chunkId: string;
  documentId: string;
  title: string;
  sectionHeading: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  text: string;
  tokenCount: number;
  accessedAt: string;
  vectorScore?: number;
  keywordScore?: number;
  vectorRank?: number;
  keywordRank?: number;
  rrfScore?: number;
  finalScore: number;
  retrievalSources: RetrievalSource[];
};

export type RetrievalRequest = {
  query: string;
  queryEmbedding?: number[];
  filters?: RetrievalFilters;
  topK?: number;
};

export type SafetyLevel =
  | "educational"
  | "diagnosis-seeking"
  | "medication-advice"
  | "urgent"
  | "unsupported";

export type Citation = {
  id: string;
  title: string;
  sectionHeading: string;
  sourceName: string;
  sourceUrl: string;
};

export type RetrievedChunkSummary = {
  chunkId: string;
  title: string;
  sectionHeading: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  vectorScore?: number;
  keywordScore?: number;
  vectorRank?: number;
  keywordRank?: number;
  rrfScore?: number;
  finalScore: number;
  retrievalSources: RetrievalSource[];
};

export type QueryResponse = {
  answer: string;
  safetyLevel: SafetyLevel;
  disclaimer: string;
  citations: Citation[];
  retrievedChunks: RetrievedChunkSummary[];
};

export type SourceSummary = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  accessedAt: string;
  sectionCount: number;
};

export type SourcesResponse = {
  sources: SourceSummary[];
  topics: string[];
};
