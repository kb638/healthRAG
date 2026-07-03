# Production Upgrade Path

HealthWise RAG Demo is intentionally small and local. A production consumer-health system would need stronger infrastructure, governance, monitoring, and clinical review.

| Demo Choice | Production Upgrade |
|---|---|
| Local Qdrant Docker service | Qdrant Cloud or clustered Qdrant; alternatives include Pinecone, Weaviate, Milvus, or pgvector |
| Local Solr Docker service | Managed or clustered Solr, OpenSearch, or Elasticsearch |
| Reciprocal rank fusion | Tuned RRF, reranker model, or learning-to-rank pipeline |
| Small curated source list | CMS-backed ingestion pipeline with source ownership and freshness checks |
| Cheerio HTML extraction | Robust content extraction jobs with validation and change detection |
| Prompt guardrails | Policy engine, human review workflow, eval suite, and release gates |
| Manual evaluation table | Continuous evaluation with curated test sets and citation-faithfulness checks |
| Local dev server | Cloud deployment with CI/CD, observability, alerting, and rollback |
| Demo-only health disclaimer | Legal, clinical, editorial, and product review process |

## WebMD-Relevant Upgrades

- Use Solr/Lucene strengths for high-traffic enterprise content search, exact medical terms, faceting, and keyword relevance.
- Add accessibility review for public consumer-health audiences.
- Add performance monitoring for search latency, API latency, and frontend web vitals.
- Add clinical editorial review before medical content changes go live.
- Add content freshness checks for source pages, medical guidelines, and reviewed articles.
- Add observability around retrieval quality, no-result rate, unsupported-answer rate, and safety-trigger rate.

## Privacy Boundary

This demo does not handle protected health information, user accounts, or personalization. If the product ever accepted sensitive user health data, production design would need privacy review, access controls, retention policy, audit logging, and HIPAA-aware infrastructure decisions.
