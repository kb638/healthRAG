import MiniSearch from "minisearch";

import type { Chunk } from "@healthwise/shared";

import { matchesFilters } from "./filters.js";
import type { BackendSearchResult, KeywordSearchBackend, KeywordSearchInput } from "./types.js";

type SearchableChunk = Chunk & {
  searchableText: string;
};

export class InMemoryKeywordBackend implements KeywordSearchBackend {
  private readonly miniSearch: MiniSearch<SearchableChunk>;
  private readonly chunksById: Map<string, SearchableChunk>;

  constructor(chunks: Chunk[]) {
    const searchableChunks = chunks.map((chunk) => ({
      ...chunk,
      searchableText: `${chunk.title}\n${chunk.topic}\n${chunk.sectionHeading}\n${chunk.text}`
    }));

    this.chunksById = new Map(searchableChunks.map((chunk) => [chunk.id, chunk]));
    this.miniSearch = new MiniSearch<SearchableChunk>({
      idField: "id",
      fields: ["title", "topic", "sectionHeading", "text", "searchableText"],
      storeFields: ["id"]
    });
    this.miniSearch.addAll(searchableChunks);
  }

  async search(input: KeywordSearchInput): Promise<BackendSearchResult[]> {
    const rawResults = this.miniSearch.search(input.query, {
      boost: {
        title: 3,
        topic: 2,
        sectionHeading: 2,
        text: 1,
        searchableText: 1
      },
      combineWith: "OR",
      prefix: true,
      fuzzy: 0.1
    });

    return rawResults
      .filter((result) => {
        const chunk = this.chunksById.get(String(result.id));
        return Boolean(chunk && matchesFilters(chunk, input.filters));
      })
      .slice(0, input.limit)
      .map((result, index) => ({
        chunkId: String(result.id),
        score: result.score,
        rank: index + 1,
        source: "solr"
      }));
  }
}
