import OpenAI from "openai";

import { env } from "../../config/env.js";
import { buildGroundedMessages } from "./prompt.js";
import type { AnswerGenerator, AnswerGeneratorInput, QueryEmbedder } from "./types.js";
import { createCitations } from "./citations.js";

export class OpenAiQueryEmbedder implements QueryEmbedder {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  async embed(query: string): Promise<number[]> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for query embeddings");
    }

    const response = await this.client.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: query
    });
    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error("OpenAI did not return a query embedding");
    }

    return embedding;
  }
}

export class OpenAiAnswerGenerator implements AnswerGenerator {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  async generate(input: AnswerGeneratorInput): Promise<string> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for answer generation");
    }

    const citations = createCitations(input.results);
    const messages = buildGroundedMessages({
      query: input.query,
      safetyLevel: input.safetyLevel,
      results: input.results,
      citations
    });

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 450
    });

    return response.choices[0]?.message.content?.trim() || "";
  }
}
