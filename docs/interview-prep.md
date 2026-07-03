# Interview Prep

## 60-Second Pitch

I built a health education RAG demo inspired by the trust requirements of consumer health products. The pipeline ingests trusted public medical sources with Cheerio, chunks them with LangChain Text Splitters, embeds them with OpenAI embeddings, stores vectors in Qdrant, indexes text in Solr/Lucene, and retrieves relevant chunks with hybrid search. I combine Qdrant semantic vector search with Solr/Lucene BM25 keyword matching because exact medical terms and semantic meaning both matter. The Express API uses only retrieved context, returns citations, and applies safety rules for urgent or diagnosis-seeking queries. The frontend is a responsive React app that shows answers, sources, and retrieval details. I chose Solr because it maps directly to the WebMD job description, and Qdrant because it is a practical local vector database for RAG.

## Shorter Pitch

I built a source-grounded health education assistant with React, Express, OpenAI embeddings, Qdrant vector search, Solr keyword search, citations, and medical safety guardrails. The point was not to make an AI doctor; it was to show how I would build a trustworthy consumer-health information workflow with explainable retrieval and clear limitations.

## Technology Choices

| Choice | Why It Matters |
|---|---|
| React + TypeScript | Strong frontend structure with shared API contracts. |
| Express + TypeScript | Small, readable backend with clear route/service separation. |
| Cheerio | Practical server-side extraction from trusted public pages. |
| LangChain Text Splitters | Proven recursive chunking instead of hand-rolled splitting. |
| OpenAI embeddings | Converts chunks and queries into semantic vectors. |
| Qdrant | Local vector database for semantic search. |
| Solr/Lucene | Enterprise-grade keyword search and a direct WebMD-relevant skill. |
| RRF fusion | Combines vector and keyword ranking without overfitting a demo. |
| Zod | Validates API input before it reaches business logic. |
| Vitest | Fast tests for chunking, retrieval, API behavior, safety, and UI contracts. |

## Questions To Ask The Hiring Manager

- How does your team balance speed of product delivery with medical content accuracy and editorial review?
- What kinds of performance or accessibility challenges come up in WebMD's high-traffic public web applications?
- How does search work across WebMD content today, and where do Solr/Lucene fit in your architecture?
- For an Associate Engineer, what would success look like in the first 90 days?

## Strong Talking Points

- I scoped the app as health education, not diagnosis or treatment.
- I preserved source metadata from ingestion through citations.
- I used hybrid retrieval because medical search needs both semantic meaning and exact terms.
- I exposed retrieval details in the UI so the answer is inspectable.
- I added deterministic safety handling before retrieval/generation for urgent requests.
- I documented limitations and production upgrades instead of pretending the demo is production-ready.

## When Asked About Tradeoffs

This is a small local demo, so I chose transparent infrastructure over managed services. In production I would move Qdrant and Solr to managed or clustered services, add editorial workflows, run citation-faithfulness evals, monitor content freshness, and build stronger privacy boundaries before handling any user health data.

## How the App Looks like
<img width="1911" height="959" alt="image" src="https://github.com/user-attachments/assets/48e35018-e28a-4a66-a44b-9f0726944bf9" />


