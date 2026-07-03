# Vector DB And Solr/Lucene Hybrid Retrieval

Phase 04 builds the retrieval layer that will feed the answer API in Phase 05.

## Services

Run local search services:

```bash
npm run services:up
```

This starts:

- Qdrant at `http://localhost:6333`
- Solr at `http://localhost:8983/solr`

If this command cannot connect to `dockerDesktopLinuxEngine`, start Docker Desktop first and wait until it says the engine is running.

Stop services:

```bash
npm run services:down
```

## Setup And Indexing

Prepare Qdrant:

```bash
npm run qdrant:setup
npm run index:qdrant
```

Prepare Solr:

```bash
npm run solr:setup
npm run index:solr
```

Run a retrieval smoke test:

```bash
npm run retrieve:test -- "What are symptoms of type 2 diabetes?"
```

The smoke test embeds the query with OpenAI, searches Qdrant and Solr, fuses the result lists, and prints ranked chunks.

## Retrieval Strategy

```txt
query
  -> OpenAI query embedding
  -> Qdrant vector search
  +
  -> Solr/Lucene BM25 keyword search
  -> reciprocal rank fusion
  -> top source-grounded chunks
```

Qdrant handles semantic similarity. Solr/Lucene handles exact medical terms and BM25-style keyword relevance.

## Fusion

The retriever uses Reciprocal Rank Fusion:

```txt
score = 1 / (60 + vectorRank) + 1 / (60 + keywordRank)
```

If a chunk appears in both systems, it receives score contribution from both. Results preserve raw vector score, keyword score, ranks, source URL, and section metadata.

## Filters

Retrieval supports:

- `topic`
- `sourceName`

The same filters are applied to vector and keyword retrieval.

## Test Strategy

Automated tests use local in-memory adapters over the generated `chunks.json` and `embedding-cache.json`. This verifies retrieval behavior without requiring Docker for every test run. The production-facing scripts still target Qdrant and Solr.
