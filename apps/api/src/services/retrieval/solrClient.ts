import type { RetrievalFilters } from "@healthwise/shared";

import type { BackendSearchResult, KeywordSearchBackend, KeywordSearchInput } from "./types.js";

type SolrDocument = {
  id: string;
  chunkId?: string;
  score?: number;
};

type SolrSearchResponse = {
  response?: {
    docs?: SolrDocument[];
  };
};

export class SolrKeywordBackend implements KeywordSearchBackend {
  constructor(
    private readonly url: string,
    private readonly collection: string
  ) {}

  async search(input: KeywordSearchInput): Promise<BackendSearchResult[]> {
    const params = new URLSearchParams({
      q: input.query,
      defType: "edismax",
      qf: "title^3 topic^2 sectionHeading^2 text",
      rows: String(input.limit),
      fl: "id,chunkId,score",
      wt: "json"
    });

    for (const filterQuery of createSolrFilterQueries(input.filters)) {
      params.append("fq", filterQuery);
    }

    const response = await fetch(`${this.url}/${this.collection}/select?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Solr search failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as SolrSearchResponse;

    return (body.response?.docs ?? []).map((document, index) => ({
      chunkId: document.chunkId ?? document.id,
      score: document.score ?? 0,
      rank: index + 1,
      source: "solr"
    }));
  }
}

function createSolrFilterQueries(filters: RetrievalFilters = {}): string[] {
  const filterQueries: string[] = [];

  if (filters.topic) {
    filterQueries.push(`topic:${quoteSolrValue(filters.topic)}`);
  }

  if (filters.sourceName) {
    filterQueries.push(`sourceName:${quoteSolrValue(filters.sourceName)}`);
  }

  return filterQueries;
}

function quoteSolrValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
