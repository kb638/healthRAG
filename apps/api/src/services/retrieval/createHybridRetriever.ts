import type { Chunk, VectorRecord } from "@healthwise/shared";

import { HybridRetriever } from "./hybridRetriever.js";
import { InMemoryKeywordBackend } from "./inMemoryKeywordBackend.js";
import { InMemoryVectorBackend } from "./inMemoryVectorBackend.js";
import { QdrantVectorBackend } from "./qdrantClient.js";
import { SolrKeywordBackend } from "./solrClient.js";

export function createLocalHybridRetriever(chunks: Chunk[], vectors: VectorRecord[]) {
  return new HybridRetriever({
    chunks,
    vectorBackend: new InMemoryVectorBackend(chunks, vectors),
    keywordBackend: new InMemoryKeywordBackend(chunks)
  });
}

export function createRemoteHybridRetriever(options: {
  chunks: Chunk[];
  qdrantUrl: string;
  qdrantCollection: string;
  solrUrl: string;
  solrCollection: string;
}) {
  return new HybridRetriever({
    chunks: options.chunks,
    vectorBackend: new QdrantVectorBackend(options.qdrantUrl, options.qdrantCollection),
    keywordBackend: new SolrKeywordBackend(options.solrUrl, options.solrCollection)
  });
}
