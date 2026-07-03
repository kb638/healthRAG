import type { Citation, RetrievalResult, SafetyLevel } from "@healthwise/shared";

export type GroundedPromptInput = {
  query: string;
  safetyLevel: SafetyLevel;
  results: RetrievalResult[];
  citations: Citation[];
};

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export function buildGroundedMessages(input: GroundedPromptInput): ChatMessage[] {
  const sourceExcerpts = input.results
    .map((result, index) => {
      const citation = input.citations.find(
        (candidate) =>
          candidate.title === result.title &&
          candidate.sectionHeading === result.sectionHeading &&
          candidate.sourceUrl === result.sourceUrl
      );
      const citationId = citation?.id ?? `source-${index + 1}`;
      const citationNumber = citationId.replace("source-", "");

      return [
        `[${citationNumber}] ${result.title} - ${result.sectionHeading}`,
        `Source: ${result.sourceUrl}`,
        `Excerpt: ${result.text}`
      ].join("\n");
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content: [
        "You are a health education assistant for a demo RAG application.",
        "Answer only using the provided source excerpts.",
        "Do not diagnose, prescribe, or replace professional medical advice.",
        "If the sources do not answer the question, say so.",
        "Include citations using bracketed source numbers like [1].",
        "Use clear, plain language.",
        "For urgent symptoms, advise immediate medical care."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        `Question:\n${input.query}`,
        `Safety classification:\n${input.safetyLevel}`,
        `Retrieved source excerpts:\n${sourceExcerpts}`
      ].join("\n\n")
    }
  ];
}
