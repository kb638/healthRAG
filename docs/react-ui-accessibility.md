# React UI And Accessibility

Phase 06 turns the disabled React shell into a usable RAG interface.

## User Flow

The web app calls the Phase 05 Express API:

```txt
GET /health
GET /sources
POST /query
```

The user can type a health information question, optionally select a topic filter, or choose an example question. The UI sends `query` and optional `filters` to the backend, then renders the answer, citations, safety state, and retrieval details.

## Component Split

The app is intentionally modular:

```txt
apps/web/src/api.ts
apps/web/src/components/ApiStatus.tsx
apps/web/src/components/QueryForm.tsx
apps/web/src/components/ExampleQuestions.tsx
apps/web/src/components/SafetyBanner.tsx
apps/web/src/components/AnswerPanel.tsx
apps/web/src/components/SourceCard.tsx
apps/web/src/components/RetrievalDetails.tsx
```

`App.tsx` owns page state and orchestration. The components stay focused on one UI responsibility each.

## Trust And Debug Details

The answer view includes:

- A visible educational disclaimer.
- Safety banners for urgent, unsupported, diagnosis-seeking, and medication-advice questions.
- Citation cards with source name, section heading, and clickable source URLs.
- A collapsible "Why this answer?" panel with Qdrant vector score, Solr BM25 score, fused RRF score, ranks, and retrieval source badges.

## Accessibility Notes

The UI uses:

- Semantic form, section, article, aside, details, and summary elements.
- Explicit labels for the question input and topic filter.
- Disabled submit state while a query is running.
- `role="status"` and `aria-live` for loading state.
- `role="alert"` for error and non-educational safety states.
- Keyboard-focus outlines for form controls and example buttons.
- Responsive single-column layouts for narrow screens.

## Local Check

Run the app:

```bash
npm run services:up
npm run dev
```

Open:

```txt
http://localhost:5173
```

The API runs at:

```txt
http://localhost:4000
```
