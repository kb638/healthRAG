import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { SolrDocument } from "@healthwise/shared";

const solrUrl = process.env.SOLR_URL ?? "http://localhost:8983/solr";
const collection = process.env.SOLR_COLLECTION ?? "healthwise_chunks";
const solrDocumentsPath = resolve(process.cwd(), "data/indexes/solr-documents.json");

async function main() {
  const documents = await readSolrDocuments();
  const response = await fetch(`${solrUrl}/${collection}/update?commit=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(documents)
  });

  if (!response.ok) {
    throw new Error(`Solr indexing failed: ${response.status} ${await response.text()}`);
  }

  console.log(`Indexed ${documents.length} documents into Solr collection ${collection}`);
}

async function readSolrDocuments(): Promise<SolrDocument[]> {
  const raw = await readFile(solrDocumentsPath, "utf8");
  const documents = JSON.parse(raw) as SolrDocument[];

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("Expected data/indexes/solr-documents.json to contain documents");
  }

  return documents;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
