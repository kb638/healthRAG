import cors from "cors";
import express, { type ErrorRequestHandler } from "express";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { createQueryRouter } from "./routes/query.js";
import { createSourcesRouter } from "./routes/sources.js";
import { createRemoteHybridRetriever } from "./services/retrieval/createHybridRetriever.js";
import { loadRetrievalData } from "./services/retrieval/loadRetrievalData.js";
import { OpenAiAnswerGenerator, OpenAiQueryEmbedder } from "./services/rag/openAiClients.js";
import { DefaultRagQueryService } from "./services/rag/ragQueryService.js";
import type { RagQueryService } from "./services/rag/types.js";
import { FileSourceService, type SourceService } from "./services/sources/sourceService.js";

export type AppServices = {
  sourceService: SourceService;
  ragQueryService: RagQueryService;
};

export async function createDefaultServices(): Promise<AppServices> {
  const { chunks } = await loadRetrievalData();
  const retriever = createRemoteHybridRetriever({
    chunks,
    qdrantUrl: env.QDRANT_URL,
    qdrantCollection: env.QDRANT_COLLECTION,
    solrUrl: env.SOLR_URL,
    solrCollection: env.SOLR_COLLECTION
  });

  return {
    sourceService: new FileSourceService(),
    ragQueryService: new DefaultRagQueryService(
      new OpenAiQueryEmbedder(),
      retriever,
      new OpenAiAnswerGenerator()
    )
  };
}

export function createApp(services: AppServices) {
  const app = express();

  app.use(
    cors({
      origin: env.WEB_ORIGIN
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/sources", createSourcesRouter(services.sourceService));
  app.use("/query", createQueryRouter(services.ragQueryService));
  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: "internal_error",
    message: "Something went wrong while processing the request."
  });
};
