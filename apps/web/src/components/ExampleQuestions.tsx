export type ExampleQuestion = {
  label: string;
  question: string;
  topic?: string;
};

type ExampleQuestionsProps = {
  examples: ExampleQuestion[];
  disabled: boolean;
  onSelect: (example: ExampleQuestion) => void;
};

export function ExampleQuestions({ examples, disabled, onSelect }: ExampleQuestionsProps) {
  return (
    <section className="examples" aria-labelledby="examples-title">
      <h2 id="examples-title">Example questions</h2>
      <div className="example-list">
        {examples.map((example) => (
          <button
            aria-label={`Ask example question: ${example.question}`}
            className="example-chip"
            disabled={disabled}
            key={example.question}
            onClick={() => onSelect(example)}
            type="button"
          >
            {example.label}
          </button>
        ))}
      </div>
    </section>
  );
}
