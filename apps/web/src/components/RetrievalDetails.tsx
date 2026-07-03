import { ChevronDown, Database, SearchCheck } from "lucide-react";

import type { RetrievedChunkSummary } from "@healthwise/shared";

type RetrievalDetailsProps = {
  chunks: RetrievedChunkSummary[];
};

export function RetrievalDetails({ chunks }: RetrievalDetailsProps) {
  if (chunks.length === 0) {
    return null;
  }

  return (
    <details className="retrieval-details">
      <summary>
        <span>
          <SearchCheck aria-hidden="true" size={20} />
          Why this answer?
        </span>
        <span className="summary-count">
          {chunks.length} retrieved {chunks.length === 1 ? "section" : "sections"}
          <ChevronDown aria-hidden="true" size={18} />
        </span>
      </summary>

      <div className="retrieval-list">
        {chunks.map((chunk, index) => (
          <article className="retrieval-row" key={chunk.chunkId}>
            <div className="retrieval-row__main">
              <span className="rank-badge">{index + 1}</span>
              <div>
                <h3>{chunk.sectionHeading}</h3>
                <p>
                  {chunk.title} - {chunk.sourceName}
                </p>
                <div className="source-badges">
                  {chunk.retrievalSources.map((source) => (
                    <span className={`source-badge source-badge--${source}`} key={source}>
                      <Database aria-hidden="true" size={14} />
                      {source === "qdrant" ? "Qdrant vector" : "Solr keyword"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <dl className="score-grid">
              <div>
                <dt>Qdrant score</dt>
                <dd>{formatScore(chunk.vectorScore)}</dd>
              </div>
              <div>
                <dt>Solr BM25</dt>
                <dd>{formatScore(chunk.keywordScore)}</dd>
              </div>
              <div>
                <dt>Fused RRF</dt>
                <dd>{formatScore(chunk.rrfScore ?? chunk.finalScore)}</dd>
              </div>
              <div>
                <dt>Ranks</dt>
                <dd>
                  V{formatRank(chunk.vectorRank)} / K{formatRank(chunk.keywordRank)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </details>
  );
}

function formatScore(value: number | undefined) {
  if (value === undefined) {
    return "not matched";
  }

  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatRank(value: number | undefined) {
  return value === undefined ? "-" : String(value);
}
