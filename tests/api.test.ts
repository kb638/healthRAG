import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApp, type AppServices } from "../apps/api/src/app.js";
import { DefaultRagQueryService } from "../apps/api/src/services/rag/ragQueryService.js";
import type {
  AnswerGenerator,
  QueryEmbedder,
  Retriever
} from "../apps/api/src/services/rag/types.js";
import type { SourceService } from "../apps/api/src/services/sources/sourceService.js";
import type { QueryResponse, RetrievalResult, SourcesResponse } from "@healthwise/shared";

let server: Server | undefined;

afterEach(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  server = undefined;
});

describe("API routes", () => {
  it("returns validation error for empty query", async () => {
    const client = await startTestApp();
    const response = await client.post("/query", { query: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_error");
  });

  it("returns deterministic urgent safety response before retrieval", async () => {
    const retriever: Retriever = {
      async search() {
        throw new Error("Retrieval should not run for urgent requests");
      }
    };
    const client = await startTestApp({
      ragQueryService: createRagService({
        retriever
      })
    });
    const response = await client.post("/query", {
      query: "I have chest pain and trouble breathing"
    });

    expect(response.status).toBe(200);
    expect(response.body.safetyLevel).toBe("urgent");
    expect(response.body.answer).toContain("emergency");
    expect(response.body.citations).toEqual([]);
    expect(response.body.retrievedChunks).toEqual([]);
  });

  it("returns unsupported when retrieval finds no chunks", async () => {
    const client = await startTestApp({
      ragQueryService: createRagService({
        retriever: {
          async search() {
            return [];
          }
        }
      })
    });
    const response = await client.post("/query", {
      query: "What source explains moon allergies?"
    });

    expect(response.status).toBe(200);
    expect(response.body.safetyLevel).toBe("unsupported");
    expect(response.body.answer).toContain("do not support");
    expect(response.body.citations).toEqual([]);
  });

  it("returns cited answer and retrieval details for normal query", async () => {
    const client = await startTestApp();
    const response = await client.post("/query", {
      query: "What are common symptoms of type 2 diabetes?",
      filters: {
        topic: "diabetes"
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject<Partial<QueryResponse>>({
      safetyLevel: "educational",
      disclaimer: "This is educational information and not medical advice."
    });
    expect(response.body.answer).toContain("[1]");
    expect(response.body.citations).toHaveLength(1);
    expect(response.body.citations[0].sourceUrl).toMatch(/^https:\/\//);
    expect(response.body.retrievedChunks[0].sourceUrl).toMatch(/^https:\/\//);
    expect(response.body.retrievedChunks[0]).toMatchObject({
      vectorScore: 0.9,
      keywordScore: 5,
      rrfScore: 0.03,
      retrievalSources: ["qdrant", "solr"]
    });
  });

  it("lists sources and topics", async () => {
    const client = await startTestApp();
    const response = await client.get("/sources");

    expect(response.status).toBe(200);
    expect(response.body.sources).toHaveLength(1);
    expect(response.body.topics).toEqual(["diabetes"]);
  });
});

async function startTestApp(overrides: Partial<AppServices> = {}) {
  const app = createApp({
    sourceService: overrides.sourceService ?? createSourceService(),
    ragQueryService: overrides.ragQueryService ?? createRagService()
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });

  const activeServer = server;

  if (!activeServer) {
    throw new Error("Test server did not start");
  }

  const address = activeServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    async get(path: string) {
      return request("GET", `${baseUrl}${path}`);
    },
    async post(path: string, body: unknown) {
      return request("POST", `${baseUrl}${path}`, body);
    }
  };
}

async function request(method: string, url: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await response.json();

  return {
    status: response.status,
    body: json
  };
}

function createRagService(overrides: Partial<{
  embedder: QueryEmbedder;
  retriever: Retriever;
  answerGenerator: AnswerGenerator;
}> = {}) {
  return new DefaultRagQueryService(
    overrides.embedder ?? {
      async embed() {
        return [1, 0, 0];
      }
    },
    overrides.retriever ?? {
      async search() {
        return [diabetesResult];
      }
    },
    overrides.answerGenerator ?? {
      async generate() {
        return "Common symptoms can include increased thirst and urination [1].";
      }
    }
  );
}

function createSourceService(): SourceService {
  const response: SourcesResponse = {
    sources: [
      {
        id: "medlineplus-type-2-diabetes",
        title: "Diabetes Type 2",
        sourceName: "MedlinePlus",
        sourceUrl: "https://medlineplus.gov/diabetestype2.html",
        topic: "diabetes",
        accessedAt: "2026-07-02",
        sectionCount: 7
      }
    ],
    topics: ["diabetes"]
  };

  return {
    async listSources() {
      return response;
    }
  };
}

const diabetesResult: RetrievalResult = {
  chunkId: "chunk-1",
  documentId: "medlineplus-type-2-diabetes",
  title: "Diabetes Type 2",
  sectionHeading: "What are the symptoms of type 2 diabetes?",
  sourceName: "MedlinePlus",
  sourceUrl: "https://medlineplus.gov/diabetestype2.html",
  topic: "diabetes",
  text: "Symptoms can include increased thirst and urination.",
  tokenCount: 10,
  accessedAt: "2026-07-02",
  vectorScore: 0.9,
  keywordScore: 5,
  vectorRank: 1,
  keywordRank: 1,
  rrfScore: 0.03,
  finalScore: 0.03,
  retrievalSources: ["qdrant", "solr"]
};
