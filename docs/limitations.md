# Limitations

This project is a focused interview demo, not a production medical product.

## Product Limitations

- The app provides educational information only.
- It is not a diagnosis system, symptom checker, clinical decision support tool, or medical device.
- It does not provide personalized treatment plans or medication dosing instructions.
- It does not handle user accounts or protected health information.

## Data Limitations

- The corpus is intentionally small.
- Sources are curated manually.
- Source quality depends on the selected public pages.
- Content freshness is not automatically monitored.
- The project avoids storing WebMD article text; public sources are used for the local corpus.

## Retrieval Limitations

- Retrieval quality has only a small manual evaluation set.
- Ranking parameters are not tuned on real user behavior.
- Qdrant and Solr run locally through Docker, not as production clusters.
- Hybrid retrieval uses RRF but does not yet include a reranker.

## Generation Limitations

- LLM output still needs evaluation.
- Prompt guardrails are not a substitute for policy review or clinical review.
- The backend now protects against uncited generated answers, but production would need stronger citation-faithfulness checks.

## UI Limitations

- The UI is local only.
- Accessibility has been considered in structure and styling, but a full audit has not been completed.
- Screenshots are omitted for now.
