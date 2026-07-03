# HealthWise RAG Demo

## What It Is

HealthWise RAG Demo is a source-grounded health education assistant. It retrieves trusted public medical information, generates cited answers, and applies safety boundaries for urgent, diagnosis-seeking, medication-related, and unsupported questions.

This is an interview-ready demo inspired by the trust requirements of consumer health products. It is not an AI doctor, diagnosis tool, symptom checker, clinical decision support system, or medical device.

## Why I Built It

Healthcare search and answer experiences need more than a generic chatbot. They need trusted sources, citations, safety boundaries, explainable retrieval, accessible UI, and clear limitations.

This project shows how I would approach that problem as an Associate Engineer candidate: small scope, modular design, strong TypeScript contracts, practical local infrastructure, and a clear path from demo to production.

## Architecture

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

Repo structure:

```txt
apps/
  api/        Express + TypeScript REST API
  web/        React + TypeScript + Vite app
packages/
  shared/     Shared TypeScript API contracts
data/
  sources/    Curated source metadata
  processed/  Normalized documents and chunks
  indexes/    Embedding cache plus Qdrant/Solr payloads
scripts/      Ingestion, chunking, embedding, setup, indexing
docs/         Architecture, evaluation, safety, and interview notes
tests/        Vitest coverage
```

More detail: [docs/architecture.md](docs/architecture.md)

## Tech Stack

| Area | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, lucide-react |
| Backend | Node.js, Express, TypeScript, Zod |
| Ingestion | Cheerio |
| Chunking | LangChain Text Splitters |
| Token counting | js-tiktoken |
| Embeddings | OpenAI `text-embedding-3-small` |
| Answer generation | OpenAI chat model configured by `.env` |
| Vector search | Qdrant |
| Keyword search | Solr/Lucene BM25 |
| Retrieval fusion | Reciprocal rank fusion |
| Local services | Docker Compose |
| Testing | Vitest |

## RAG Pipeline

1. Curated public medical source URLs live in `data/sources/sources.json`.
2. `npm run ingest` fetches and normalizes trusted source pages.
3. `npm run chunk` creates section-aware recursive chunks.
4. `npm run embed` generates OpenAI embeddings and writes cached index payloads.
5. `npm run services:up` starts local Qdrant and Solr containers.
6. `npm run index:qdrant` stores vectors in Qdrant.
7. `npm run index:solr` stores searchable documents in Solr.
8. `POST /query` validates input, classifies safety intent, retrieves chunks, generates a grounded answer, and returns citations.

Hybrid retrieval combines Qdrant semantic search with Solr keyword search because medical questions often need both meaning-based retrieval and exact term matching.

## Safety Boundaries

The app is scoped to education only.

- Urgent queries bypass retrieval and LLM generation.
- Diagnosis-seeking questions receive a clear boundary.
- Medication-advice questions avoid personalized dosing or interaction guidance.
- Unsupported questions return a deterministic unsupported response.
- Generated answers must include a supported citation marker or the API replaces them with a cautious cited fallback.
- The UI keeps the educational disclaimer visible.

More detail: [docs/safety.md](docs/safety.md)

## Local Setup

Requirements:

- Node.js 20+
- npm 10+
- Docker Desktop
- OpenAI API key for embedding and answer generation

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

Add your OpenAI key to `.env`:

```txt
OPENAI_API_KEY=your_key_here
```

Build or refresh the corpus:

```bash
npm run ingest
npm run chunk
npm run embed
```

Start local Qdrant and Solr:

```bash
npm run services:up
npm run qdrant:setup
npm run solr:setup
npm run index:qdrant
npm run index:solr
```

Run the API and web app:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

Useful local URLs:

| Service | URL |
|---|---|
| Web app | `http://localhost:5173` |
| API health | `http://localhost:4000/health` |
| Sources API | `http://localhost:4000/sources` |
| Qdrant dashboard | `http://localhost:6333/dashboard` |
| Solr admin | `http://localhost:8983/solr` |

## Example Queries

| Query | Expected Behavior |
|---|---|
| What are common symptoms of type 2 diabetes? | Cited educational answer from diabetes sources. |
| What can trigger asthma symptoms? | Cited educational answer from asthma sources. |
| What should I know about high blood pressure? | Cited educational answer from blood pressure sources. |
| When should someone seek medical help for flu symptoms? | Cited general answer without personal triage. |
| Can you diagnose my chest pain? | Urgent safety response, no retrieval or LLM generation. |
| What source explains moon allergies? | Unsupported response because the corpus does not support it. |

## Evaluation

Current automated coverage:

- Chunking tests.
- Retrieval tests.
- Safety classification tests.
- Urgent-query bypass tests.
- API response shape tests.
- Citation fallback test for uncited LLM output.
- Frontend static smoke checks for component wiring and accessibility markers.

Run checks:

```bash
npm test
npm run typecheck
npm run build
```

Manual evaluation table: [docs/evaluation.md](docs/evaluation.md)

## Screenshots

Screenshots are intentionally omitted for now. The UI is available locally at:

```txt
http://localhost:5173
```

Recommended path if a screenshot is added later:

```txt
docs/screenshots/phase-06-ui.png
```

## Production Upgrade Path

| Demo Choice | Production Upgrade |
|---|---|
| Local Qdrant Docker service | Qdrant Cloud or clustered Qdrant; alternatives include Pinecone, Weaviate, Milvus, or pgvector |
| Local Solr Docker service | Managed or clustered Solr, OpenSearch, or Elasticsearch |
| Reciprocal rank fusion | Tuned RRF, reranker model, or learning-to-rank pipeline |
| Manual source list | CMS-backed ingestion pipeline with freshness checks |
| Prompt guardrails | Policy engine, human review workflow, eval suite, and release gates |
| Local dev | Cloud deployment with CI/CD, observability, alerting, and rollback |

More detail: [docs/production-upgrade-path.md](docs/production-upgrade-path.md)

## Limitations

- Small demo corpus.
- Educational use only.
- Not a diagnostic or treatment system.
- No PHI, user accounts, personalization, or HIPAA workflow.
- Local Qdrant and Solr are not production-scale deployments.
- Source freshness is not automatically monitored.
- LLM output still needs clinical/editorial evaluation.
- Accessibility has been considered, but a full accessibility audit has not been completed.

More detail: [docs/limitations.md](docs/limitations.md)

## Interview Notes

60-second pitch:

> I built a health education RAG demo inspired by the trust requirements of consumer health products. The pipeline ingests trusted public medical sources with Cheerio, chunks them with LangChain Text Splitters, embeds them with OpenAI embeddings, stores vectors in Qdrant, indexes text in Solr/Lucene, and retrieves relevant chunks with hybrid search. I combine Qdrant semantic vector search with Solr/Lucene BM25 keyword matching because exact medical terms and semantic meaning both matter. The Express API uses only retrieved context, returns citations, and applies safety rules for urgent or diagnosis-seeking queries. The frontend is a responsive React app that shows answers, sources, and retrieval details. I chose Solr because it maps directly to the WebMD job description, and Qdrant because it is a practical local vector database for RAG.

Questions to ask the hiring manager:

- How does your team balance speed of product delivery with medical content accuracy and editorial review?
- What kinds of performance or accessibility challenges come up in WebMD's high-traffic public web applications?
- How does search work across WebMD content today, and where do Solr/Lucene fit in your architecture?
- For an Associate Engineer, what would success look like in the first 90 days?

More detail: [docs/interview-prep.md](docs/interview-prep.md)
