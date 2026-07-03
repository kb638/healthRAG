import { ExternalLink, FileText } from "lucide-react";

import type { Citation } from "@healthwise/shared";

type SourceCardProps = {
  citation: Citation;
};

export function SourceCard({ citation }: SourceCardProps) {
  return (
    <article className="source-card">
      <div className="source-card__title">
        <FileText aria-hidden="true" size={18} />
        <h3>{citation.title}</h3>
      </div>
      <p>{citation.sectionHeading}</p>
      <a href={citation.sourceUrl} rel="noreferrer" target="_blank">
        <span>{citation.sourceName}</span>
        <ExternalLink aria-hidden="true" size={15} />
      </a>
      <small>{citation.sourceUrl}</small>
    </article>
  );
}
