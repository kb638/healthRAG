import { BookOpen, Loader2, MessageSquareText } from "lucide-react";

import type { QueryResponse } from "@healthwise/shared";

type AnswerPanelProps = {
  state: "idle" | "loading" | "error" | "success";
  question?: string;
  response?: QueryResponse;
  errorMessage?: string;
};

export function AnswerPanel({ state, question, response, errorMessage }: AnswerPanelProps) {
  if (state === "idle") {
    return (
      <div className="answer-panel answer-panel--empty">
        <BookOpen aria-hidden="true" size={24} />
        <div>
          <h2 id="answer-title">Answer</h2>
          <p>Ask a question to see a cited response from the indexed sources.</p>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="answer-panel" role="status" aria-live="polite">
        <Loader2 aria-hidden="true" className="spin" size={24} />
        <div>
          <h2 id="answer-title">Answer</h2>
          <p>Retrieving sources and generating a grounded response.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="answer-panel answer-panel--error" role="alert">
        <MessageSquareText aria-hidden="true" size={24} />
        <div>
          <h2 id="answer-title">Answer</h2>
          <p>{errorMessage ?? "The API could not answer this question."}</p>
        </div>
      </div>
    );
  }

  return (
    <article className="answer-panel" aria-labelledby="answer-title">
      <div className="answer-panel__heading">
        <MessageSquareText aria-hidden="true" size={24} />
        <div>
          <h2 id="answer-title">Answer</h2>
          {question ? <p className="question-echo">{question}</p> : null}
        </div>
      </div>
      <div className="answer-copy">
        {(response?.answer ?? "").split("\n").map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </article>
  );
}
