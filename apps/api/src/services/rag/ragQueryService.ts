import type { QueryResponse } from "@healthwise/shared";

import {
  createCitations,
  createRetrievedChunkSummaries
} from "./citations.js";
import {
  classifySafetyLevel,
  medicalDisclaimer,
  safetyGuidanceFor
} from "./safety.js";
import type { AnswerGenerator, QueryEmbedder, QueryInput, RagQueryService, Retriever } from "./types.js";

const retrievalTopK = 6;

export class DefaultRagQueryService implements RagQueryService {
  constructor(
    private readonly embedder: QueryEmbedder,
    private readonly retriever: Retriever,
    private readonly answerGenerator: AnswerGenerator
  ) {}

  async answer(input: QueryInput): Promise<QueryResponse> {
    const safetyLevel = classifySafetyLevel(input.query);

    if (safetyLevel === "urgent") {
      return {
        answer: safetyGuidanceFor("urgent"),
        safetyLevel,
        disclaimer: medicalDisclaimer,
        citations: [],
        retrievedChunks: []
      };
    }

    const queryEmbedding = await this.embedder.embed(input.query);
    const results = await this.retriever.search({
      query: input.query,
      queryEmbedding,
      filters: input.filters,
      topK: retrievalTopK
    });

    if (results.length === 0) {
      return {
        answer: safetyGuidanceFor("unsupported"),
        safetyLevel: "unsupported",
        disclaimer: medicalDisclaimer,
        citations: [],
        retrievedChunks: []
      };
    }

    const citations = createCitations(results);
    const generatedAnswer = await this.answerGenerator.generate({
      query: input.query,
      safetyLevel,
      results
    });
    const citedAnswer = ensureCitedAnswer(generatedAnswer, citations.length);
    const safetyPrefix =
      safetyLevel === "educational" ? "" : `${safetyGuidanceFor(safetyLevel)}\n\n`;

    return {
      answer: `${safetyPrefix}${citedAnswer}`.trim(),
      safetyLevel,
      disclaimer: medicalDisclaimer,
      citations,
      retrievedChunks: createRetrievedChunkSummaries(results)
    };
  }
}

function ensureCitedAnswer(answer: string, citationCount: number) {
  if (hasSupportedCitation(answer, citationCount)) {
    return answer;
  }

  return [
    "I found relevant source material, but I could not produce a properly cited answer.",
    "Please review the retrieved source cards before relying on this response.",
    citationCount > 0 ? "[1]" : ""
  ]
    .join(" ")
    .trim();
}

function hasSupportedCitation(answer: string, citationCount: number) {
  const citationMatches = answer.matchAll(/\[(\d+)\]/g);

  for (const match of citationMatches) {
    const citationNumber = Number(match[1]);

    if (citationNumber >= 1 && citationNumber <= citationCount) {
      return true;
    }
  }

  return false;
}
