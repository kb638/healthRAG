import type { Citation, RetrievedChunkSummary, RetrievalResult } from "@healthwise/shared";

export function createCitations(results: RetrievalResult[]): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const key = `${result.title}::${result.sectionHeading}::${result.sourceUrl}`;

    if (seen.has(key)) {
      continue;
    }

    citations.push({
      id: `source-${citations.length + 1}`,
      title: result.title,
      sectionHeading: result.sectionHeading,
      sourceName: result.sourceName,
      sourceUrl: result.sourceUrl
    });
    seen.add(key);
  }

  return citations;
}

export function createRetrievedChunkSummaries(
  results: RetrievalResult[]
): RetrievedChunkSummary[] {
  return results.map((result) => ({
    chunkId: result.chunkId,
    title: result.title,
    sectionHeading: result.sectionHeading,
    sourceName: result.sourceName,
    sourceUrl: result.sourceUrl,
    topic: result.topic,
    vectorScore: result.vectorScore,
    keywordScore: result.keywordScore,
    vectorRank: result.vectorRank,
    keywordRank: result.keywordRank,
    rrfScore: result.rrfScore,
    finalScore: result.finalScore,
    retrievalSources: result.retrievalSources
  }));
}
