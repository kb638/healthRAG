import { Loader2, Search } from "lucide-react";
import type { FormEvent } from "react";

type QueryFormProps = {
  query: string;
  topicFilter: string;
  topics: string[];
  isSubmitting: boolean;
  onQueryChange: (query: string) => void;
  onTopicChange: (topic: string) => void;
  onSubmit: () => void;
};

export function QueryForm({
  query,
  topicFilter,
  topics,
  isSubmitting,
  onQueryChange,
  onTopicChange,
  onSubmit
}: QueryFormProps) {
  const canSubmit = query.trim().length > 0 && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canSubmit) {
      onSubmit();
    }
  }

  return (
    <form className="query-form" onSubmit={handleSubmit}>
      <div className="query-form__header">
        <div>
          <p className="eyebrow">HealthWise RAG</p>
          <h2 id="query-title">Ask a health information question</h2>
        </div>
        <p id="query-help">Answers are grounded in indexed public medical sources.</p>
      </div>

      <label className="field-label" htmlFor="query">
        Question
      </label>
      <div className="query-row">
        <input
          aria-describedby="query-help"
          autoComplete="off"
          id="query"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="What are common symptoms of type 2 diabetes?"
          type="text"
          value={query}
        />
        <button disabled={!canSubmit} type="submit">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="spin" size={18} />
          ) : (
            <Search aria-hidden="true" size={18} />
          )}
          <span>{isSubmitting ? "Asking" : "Ask"}</span>
        </button>
      </div>

      <label className="field-label field-label--compact" htmlFor="topic-filter">
        Topic filter
      </label>
      <select
        id="topic-filter"
        onChange={(event) => onTopicChange(event.target.value)}
        value={topicFilter}
      >
        <option value="">All topics</option>
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {titleCase(topic)}
          </option>
        ))}
      </select>
    </form>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
