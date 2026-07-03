import "dotenv/config";

import OpenAI from "openai";

import { createRemoteHybridRetriever } from "../apps/api/src/services/retrieval/createHybridRetriever.js";
import { loadRetrievalData } from "../apps/api/src/services/retrieval/loadRetrievalData.js";

const query = process.argv.slice(2).join(" ") || "What are symptoms of type 2 diabetes?";
const qdrantUrl = process.env.QDRANT_URL ?? "http://localhost:6333";
const qdrantCollection = process.env.QDRANT_COLLECTION ?? "healthwise_chunks";
const solrUrl = process.env.SOLR_URL ?? "http://localhost:8983/solr";
const solrCollection = process.env.SOLR_COLLECTION ?? "healthwise_chunks";
const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to embed the retrieval test query");
  }

  const { chunks } = await loadRetrievalData();
  const openai = new OpenAI();
  const embeddingResponse = await openai.embeddings.create({
    model: embeddingModel,
    input: query
  });
  const queryEmbedding = embeddingResponse.data[0]?.embedding;

  if (!queryEmbedding) {
    throw new Error("OpenAI did not return a query embedding");
  }

  const retriever = createRemoteHybridRetriever({
    chunks,
    qdrantUrl,
    qdrantCollection,
    solrUrl,
    solrCollection
  });
  const results = await retriever.search({ query, queryEmbedding, topK: 5 });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
