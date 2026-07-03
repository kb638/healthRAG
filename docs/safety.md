# Safety Boundaries

HealthWise RAG Demo is a health education project, not a medical device, diagnosis tool, symptom checker, or clinical decision support system.

## Implemented Rules

- Every answer includes the educational disclaimer in the API response and UI.
- Urgent queries are handled before embedding, retrieval, or LLM generation.
- Diagnosis-seeking and medication-advice queries receive extra safety guidance.
- Unsupported questions return a deterministic unsupported answer instead of a hallucinated response.
- Generated answers must include a supported citation marker; otherwise the API replaces the answer with a cautious cited fallback.

## Safety Levels

| Level | Example | Behavior |
|---|---|---|
| educational | What are symptoms of type 2 diabetes? | Retrieve, generate, cite sources. |
| diagnosis-seeking | Can you diagnose me with diabetes? | Add guidance that the app cannot diagnose. |
| medication-advice | What dosage of ibuprofen is safe? | Add guidance that the app cannot provide personalized medication advice. |
| urgent | I have chest pain and trouble breathing | Bypass retrieval/generation and advise immediate care. |
| unsupported | What source explains moon allergies? | Say the indexed sources do not support an answer. |

## Why This Matters

Consumer health products need a different bar from general chat apps. Even in a demo, the system should make it clear where its source grounding starts, where it stops, and when a human professional is needed.

## Production Additions

- Clinical/editorial review workflow.
- Larger medical safety policy engine.
- Citation-faithfulness evaluation.
- Monitoring for urgent, unsupported, and low-confidence queries.
- Clear privacy and retention rules before handling any user health data.
