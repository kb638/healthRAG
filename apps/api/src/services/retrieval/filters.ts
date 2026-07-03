import type { Chunk, RetrievalFilters } from "@healthwise/shared";

export function matchesFilters(chunk: Chunk, filters: RetrievalFilters = {}): boolean {
  if (filters.topic && chunk.topic !== filters.topic) {
    return false;
  }

  if (filters.sourceName && chunk.sourceName !== filters.sourceName) {
    return false;
  }

  return true;
}

export function hasFilters(filters: RetrievalFilters = {}): boolean {
  return Boolean(filters.topic || filters.sourceName);
}
