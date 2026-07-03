# Chunking And Embeddings

Phase 03 converts normalized source documents into retrieval-ready chunks and cached embeddings.

## Chunking

Run:

```bash
npm run chunk
```

Input:

```txt
data/processed/documents.json
```

Output:

```txt
data/processed/chunks.json
```

The chunker uses LangChain `RecursiveCharacterTextSplitter` for long sections and preserves health-source metadata on every chunk:

- document id
- article title
- source name
- source URL
- topic
- section heading
- access date

Token counts use the `cl100k_base` tokenizer from `js-tiktoken`.

## Embeddings

Run:

```bash
npm run embed
```

Required environment:

```txt
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Outputs:

```txt
data/indexes/embedding-cache.json
data/indexes/qdrant-points.json
data/indexes/solr-documents.json
```

The embedding script hashes chunk text and reuses cached vectors when text and model match. This avoids regenerating embeddings on every run.

## Cost Control

- Embed only the small local corpus.
- Batch document embeddings.
- Cache vectors by chunk id, text hash, and model.
- Do not embed during API startup.
- Use `text-embedding-3-small` for the demo.
