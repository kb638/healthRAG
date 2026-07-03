# Architecture

HealthWise RAG Demo is a modular TypeScript monorepo with separate boundaries for UI, API, shared contracts, data processing, and local retrieval infrastructure.

## System Diagram

```txt
Trusted public sources
  -> Cheerio ingestion
  -> normalized documents
  -> LangChain recursive chunks
  -> OpenAI embeddings
  -> Qdrant vector index
  -> Solr keyword index

User query
  -> Zod validation
  -> safety classification
  -> OpenAI query embedding
  -> Qdrant vector search
  -> Solr BM25 keyword search
  -> RRF hybrid fusion
  -> grounded prompt
  -> OpenAI answer generation
  -> cited answer + source cards + retrieval details
```

## Repo Boundaries

```txt
apps/web          React + Vite frontend
apps/api          Express REST API and RAG orchestration
packages/shared   Shared TypeScript contracts
data/sources      Curated source metadata
data/processed    Normalized documents and chunks
data/indexes      Embedding cache plus Qdrant/Solr payloads
scripts           Ingestion, chunking, embedding, setup, indexing
docs              Architecture, evaluation, safety, and interview notes
tests             Vitest coverage for pipeline and API behavior
```

## Data Pipeline

```txt
data/sources/sources.json
  -> scripts/ingest.ts
  -> data/processed/documents.json
  -> scripts/chunk.ts
  -> data/processed/chunks.json
  -> scripts/embed.ts
  -> data/indexes/embedding-cache.json
  -> data/indexes/qdrant-points.json
  -> data/indexes/solr-documents.json
```

The pipeline preserves source name, URL, topic, access date, section heading, and chunk IDs so the final answer can link back to source material.

## Retrieval Flow

```txt
query + query embedding
  -> Qdrant semantic vector search
  -> Solr/Lucene keyword search
  -> merge by chunkId
  -> reciprocal rank fusion
  -> RetrievalResult[]
```

Qdrant helps with semantic similarity. Solr helps with exact medical terms and BM25 keyword relevance. The merged result keeps both score families visible for debugging.

## API Flow

```txt
POST /query
  -> Zod request validation
  -> classifySafetyLevel(query)
  -> urgent? return deterministic safety response
  -> embed query
  -> retrieve source chunks
  -> unsupported? return deterministic unsupported response
  -> generate grounded answer
  -> enforce citation presence
  -> return QueryResponse
```

The API also exposes:

```txt
GET /health
GET /sources
```

## Frontend Flow

The React app calls `/health`, `/sources`, and `/query`. It renders:

- API status.
- Question input and topic filter.
- Example questions.
- Safety banner.
- Answer panel.
- Citation cards.
- Collapsible retrieval details.

The UI keeps the disclaimer visible and makes retrieval inspectable for interview discussion.
