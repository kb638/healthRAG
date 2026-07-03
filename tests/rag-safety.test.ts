import { describe, expect, it } from "vitest";

import { DefaultRagQueryService } from "../apps/api/src/services/rag/ragQueryService.js";
import { classifySafetyLevel } from "../apps/api/src/services/rag/safety.js";
import type {
  AnswerGenerator,
  QueryEmbedder,
  Retriever
} from "../apps/api/src/services/rag/types.js";
import type { RetrievalResult } from "@healthwise/shared";

describe("medical safety classification", () => {
  it("classifies urgent, diagnosis, medication, and educational queries", () => {
    expect(classifySafetyLevel("I have chest pain and trouble breathing")).toBe("urgent");
    expect(classifySafetyLevel("Can you diagnose me with diabetes?")).toBe("diagnosis-seeking");
    expect(classifySafetyLevel("What dosage of ibuprofen is safe?")).toBe("medication-advice");
    expect(classifySafetyLevel("What can trigger asthma symptoms?")).toBe("educational");
  });
});

describe("RAG query safety behavior", () => {
  it("bypasses embedding, retrieval, and generation for urgent queries", async () => {
    const service = new DefaultRagQueryService(
      throwingEmbedder("Embedding should not run for urgent queries"),
      throwingRetriever("Retrieval should not run for urgent queries"),
      throwingAnswerGenerator("LLM generation should not run for urgent queries")
    );

    const response = await service.answer({
      query: "I have chest pain and trouble breathing"
    });

    expect(response.safetyLevel).toBe("urgent");
    expect(response.answer).toContain("emergency");
    expect(response.citations).toEqual([]);
    expect(response.retrievedChunks).toEqual([]);
  });

  it("replaces uncited generated answers with a cited fallback", async () => {
    const service = new DefaultRagQueryService(
      fixedEmbedder,
      fixedRetriever,
      {
        async generate() {
          return "Symptoms can include increased thirst and urination.";
        }
      }
    );

    const response = await service.answer({
      query: "What are common symptoms of type 2 diabetes?"
    });

    expect(response.safetyLevel).toBe("educational");
    expect(response.answer).toContain("properly cited answer");
    expect(response.answer).toContain("[1]");
    expect(response.citations).toHaveLength(1);
  });
});

const fixedEmbedder: QueryEmbedder = {
  async embed() {
    return [1, 0, 0];
  }
};

const fixedRetriever: Retriever = {
  async search() {
    return [diabetesResult];
  }
};

function throwingEmbedder(message: string): QueryEmbedder {
  return {
    async embed() {
      throw new Error(message);
    }
  };
}

function throwingRetriever(message: string): Retriever {
  return {
    async search() {
      throw new Error(message);
    }
  };
}

function throwingAnswerGenerator(message: string): AnswerGenerator {
  return {
    async generate() {
      throw new Error(message);
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
