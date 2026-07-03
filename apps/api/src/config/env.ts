import { resolve } from "node:path";

import { config } from "dotenv";

import { z } from "zod";

import { findProjectRoot } from "../utils/paths.js";

config({ path: resolve(findProjectRoot(), ".env") });

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  OPENAI_API_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
  OPENAI_EMBEDDING_MODEL: z.preprocess(
    emptyStringToUndefined,
    z.string().default("text-embedding-3-small")
  ),
  OPENAI_CHAT_MODEL: z.preprocess(emptyStringToUndefined, z.string().default("gpt-4o-mini")),
  QDRANT_URL: z.string().url().default("http://localhost:6333"),
  QDRANT_COLLECTION: z.string().default("healthwise_chunks"),
  SOLR_URL: z.string().url().default("http://localhost:8983/solr"),
  SOLR_COLLECTION: z.string().default("healthwise_chunks")
});

export const env = envSchema.parse(process.env);
