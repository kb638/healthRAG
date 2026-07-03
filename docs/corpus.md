# Corpus And Ingestion

Phase 02 uses a small curated corpus of public health education pages from government or government-hosted medical sources.

## Source Criteria

- The source must be public and reputable.
- The page must be suitable for general health education.
- The page must have stable source metadata: title, publisher, URL, topic, and access date.
- The content must not come from copyrighted WebMD article bodies.

## Current Topics

- Type 2 diabetes
- High blood pressure
- Asthma
- Seasonal allergies
- Ibuprofen safety
- Flu symptoms
- Depression
- Cholesterol

## Ingestion Output

The ingestion script reads `data/sources/sources.json`, fetches each HTML page, removes navigation and non-content elements, extracts heading-aware sections, and writes normalized documents to `data/processed/documents.json`.

This phase intentionally stops before chunking or embeddings. Keeping ingestion separate makes the pipeline easier to debug and explain in an interview.
