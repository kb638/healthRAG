import { useEffect, useState } from "react";

import type { HealthResponse, QueryResponse, SourcesResponse } from "@healthwise/shared";

import { ApiClientError, askQuestion, getHealth, getSources } from "./api";
import { AnswerPanel } from "./components/AnswerPanel";
import { ApiStatus } from "./components/ApiStatus";
import { ExampleQuestions, type ExampleQuestion } from "./components/ExampleQuestions";
import { QueryForm } from "./components/QueryForm";
import { RetrievalDetails } from "./components/RetrievalDetails";
import { SafetyBanner } from "./components/SafetyBanner";
import { SourceCard } from "./components/SourceCard";

type ApiState =
  | { status: "checking" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

type SourcesState =
  | { status: "loading" }
  | { status: "loaded"; data: SourcesResponse }
  | { status: "error"; message: string };

type QueryState =
  | { status: "idle" }
  | { status: "loading"; question: string }
  | { status: "success"; question: string; response: QueryResponse }
  | { status: "error"; question: string; message: string };

const defaultDisclaimer = "This is educational information and not medical advice.";

const examples: ExampleQuestion[] = [
  {
    label: "Diabetes symptoms",
    question: "What are common symptoms of type 2 diabetes?",
    topic: "diabetes"
  },
  {
    label: "Asthma triggers",
    question: "What can trigger asthma symptoms?",
    topic: "asthma"
  },
  {
    label: "Blood pressure",
    question: "What should I know about high blood pressure?",
    topic: "hypertension"
  },
  {
    label: "Flu help",
    question: "When should someone seek medical help for flu symptoms?",
    topic: "flu"
  },
  {
    label: "Chest pain",
    question: "Can you diagnose my chest pain?"
  }
];

export function App() {
  const [apiState, setApiState] = useState<ApiState>({ status: "checking" });
  const [sourcesState, setSourcesState] = useState<SourcesState>({ status: "loading" });
  const [query, setQuery] = useState("What are common symptoms of type 2 diabetes?");
  const [topicFilter, setTopicFilter] = useState("diabetes");
  const [queryState, setQueryState] = useState<QueryState>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();

    void getHealth(controller.signal)
      .then((data) => setApiState({ status: "online", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setApiState({
          status: "offline",
          message: error instanceof Error ? error.message : "API unavailable"
        });
      });

    void getSources(controller.signal)
      .then((data) => setSourcesState({ status: "loaded", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setSourcesState({
          status: "error",
          message: error instanceof Error ? error.message : "Sources unavailable"
        });
      });

    return () => controller.abort();
  }, []);

  const topics = sourcesState.status === "loaded" ? sourcesState.data.topics : [];
  const currentDisclaimer =
    queryState.status === "success" ? queryState.response.disclaimer : defaultDisclaimer;
  const currentSafetyLevel =
    queryState.status === "success" ? queryState.response.safetyLevel : undefined;
  const isSubmitting = queryState.status === "loading";
  const citations = queryState.status === "success" ? queryState.response.citations : [];
  const retrievedChunks =
    queryState.status === "success" ? queryState.response.retrievedChunks : [];

  async function runQuery(nextQuery = query, nextTopic = topicFilter) {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    setQueryState({ status: "loading", question: trimmedQuery });

    try {
      const response = await askQuestion({
        query: trimmedQuery,
        filters: nextTopic ? { topic: nextTopic } : undefined
      });
      setQueryState({ status: "success", question: trimmedQuery, response });
    } catch (error) {
      setQueryState({
        status: "error",
        question: trimmedQuery,
        message:
          error instanceof ApiClientError || error instanceof Error
            ? error.message
            : "The API could not answer this question."
      });
    }
  }

  function handleExampleSelect(example: ExampleQuestion) {
    const nextTopic = example.topic ?? "";

    setQuery(example.question);
    setTopicFilter(nextTopic);
    void runQuery(example.question, nextTopic);
  }

  return (
    <main className="app-shell">
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Source-grounded health education</p>
            <h1>HealthWise RAG</h1>
            <p className="topbar-copy">
              Ask public-health questions, inspect citations, and see how hybrid retrieval
              supported the answer.
            </p>
          </div>
          <ApiStatus
            message={apiState.status === "offline" ? apiState.message : undefined}
            sourceCount={sourcesState.status === "loaded" ? sourcesState.data.sources.length : 0}
            status={apiState.status}
          />
        </header>

        <SafetyBanner disclaimer={currentDisclaimer} safetyLevel={currentSafetyLevel} />

        <section className="query-surface" aria-labelledby="query-title">
          <QueryForm
            isSubmitting={isSubmitting}
            onQueryChange={setQuery}
            onSubmit={() => void runQuery()}
            onTopicChange={setTopicFilter}
            query={query}
            topicFilter={topicFilter}
            topics={topics}
          />
          <ExampleQuestions
            disabled={isSubmitting}
            examples={examples}
            onSelect={handleExampleSelect}
          />
        </section>

        {sourcesState.status === "error" ? (
          <p className="inline-alert" role="alert">
            {sourcesState.message}
          </p>
        ) : null}

        <div className="results-grid">
          <section aria-labelledby="answer-title">
            <AnswerPanel
              errorMessage={queryState.status === "error" ? queryState.message : undefined}
              question={
                queryState.status === "loading" ||
                queryState.status === "success" ||
                queryState.status === "error"
                  ? queryState.question
                  : undefined
              }
              response={queryState.status === "success" ? queryState.response : undefined}
              state={queryState.status}
            />
          </section>

          <aside className="sources-panel" aria-labelledby="sources-title">
            <div className="sources-panel__heading">
              <h2 id="sources-title">Sources</h2>
              <span>{citations.length}</span>
            </div>
            {citations.length > 0 ? (
              <div className="source-list">
                {citations.map((citation) => (
                  <SourceCard citation={citation} key={citation.id} />
                ))}
              </div>
            ) : (
              <p className="empty-copy">{emptySourcesCopy(queryState)}</p>
            )}
          </aside>
        </div>

        <RetrievalDetails chunks={retrievedChunks} />
      </div>
    </main>
  );
}

function emptySourcesCopy(queryState: QueryState) {
  if (queryState.status === "success" && queryState.response.safetyLevel === "urgent") {
    return "No sources were retrieved because the safety rule handled this urgent request first.";
  }

  if (queryState.status === "success" && queryState.response.safetyLevel === "unsupported") {
    return "No citations are shown because the indexed sources did not support an answer.";
  }

  return "Citations will appear here after a grounded answer is generated.";
}
