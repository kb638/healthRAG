import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { NormalizedDocument, SourcesResponse } from "@healthwise/shared";

import { findProjectRoot } from "../../utils/paths.js";

export type SourceService = {
  listSources(): Promise<SourcesResponse>;
};

export class FileSourceService implements SourceService {
  constructor(private readonly rootDir = findProjectRoot()) {}

  async listSources(): Promise<SourcesResponse> {
    const path = resolve(this.rootDir, "data/processed/documents.json");
    const raw = await readFile(path, "utf8");
    const documents = JSON.parse(raw) as NormalizedDocument[];
    const sources = documents.map((document) => ({
      id: document.id,
      title: document.title,
      sourceName: document.sourceName,
      sourceUrl: document.sourceUrl,
      topic: document.topic,
      accessedAt: document.accessedAt,
      sectionCount: document.sections.length
    }));

    return {
      sources,
      topics: Array.from(new Set(sources.map((source) => source.topic))).sort()
    };
  }
}
