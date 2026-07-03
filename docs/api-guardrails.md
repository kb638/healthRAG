# Backend RAG API And Guardrails

The backend exposes the retrieval pipeline through Express routes and adds deterministic medical safety behavior before LLM generation.

## Endpoints

```txt
GET /health
GET /sources
POST /query
```

## Query Flow

```txt
POST /query
  -> validate input with Zod
  -> classify safety level
  -> return deterministic urgent response when needed
  -> embed query with OpenAI
  -> retrieve chunks through Qdrant + Solr hybrid retrieval
  -> create citations
  -> build grounded prompt
  -> call OpenAI chat model
  -> enforce citation presence
  -> return answer, citations, safety level, and retrieval details
```

## Safety Levels

- `educational`
- `diagnosis-seeking`
- `medication-advice`
- `urgent`
- `unsupported`

Urgent questions bypass retrieval and LLM generation. Unsupported questions return a deterministic "sources do not support this answer" response.

## Example Request

```json
{
  "query": "What are common symptoms of type 2 diabetes?",
  "filters": {
    "topic": "diabetes"
  }
}
```

## Example Response Shape

```json
{
  "answer": "... [1]",
  "safetyLevel": "educational",
  "disclaimer": "This is educational information and not medical advice.",
  "citations": [
    {
      "id": "source-1",
      "title": "Diabetes Type 2",
      "sectionHeading": "What are the symptoms of type 2 diabetes?",
      "sourceName": "MedlinePlus",
      "sourceUrl": "https://medlineplus.gov/diabetestype2.html"
    }
  ],
  "retrievedChunks": [
    {
      "chunkId": "...",
      "title": "Diabetes Type 2",
      "sectionHeading": "What are the symptoms of type 2 diabetes?",
      "sourceName": "MedlinePlus",
      "sourceUrl": "https://medlineplus.gov/diabetestype2.html",
      "topic": "diabetes",
      "vectorScore": 0.9,
      "keywordScore": 5,
      "vectorRank": 1,
      "keywordRank": 1,
      "rrfScore": 0.03,
      "finalScore": 0.03,
      "retrievalSources": ["qdrant", "solr"]
    }
  ]
}
```

## Cost Controls

- Urgent requests do not call OpenAI.
- The query endpoint sends only top retrieved chunks to answer generation.
- The chat model is configured through `OPENAI_CHAT_MODEL`.
- Query embeddings use `OPENAI_EMBEDDING_MODEL`.
