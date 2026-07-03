import "dotenv/config";

const solrUrl = process.env.SOLR_URL ?? "http://localhost:8983/solr";
const collection = process.env.SOLR_COLLECTION ?? "healthwise_chunks";

const fields = [
  { name: "chunkId", type: "string", indexed: true, stored: true, required: false },
  { name: "documentId", type: "string", indexed: true, stored: true, required: false },
  { name: "title", type: "text_general", indexed: true, stored: true, required: false },
  { name: "sourceName", type: "string", indexed: true, stored: true, required: false },
  { name: "sourceUrl", type: "string", indexed: false, stored: true, required: false },
  { name: "topic", type: "string", indexed: true, stored: true, required: false },
  { name: "sectionHeading", type: "text_general", indexed: true, stored: true, required: false },
  { name: "text", type: "text_general", indexed: true, stored: true, required: false },
  { name: "tokenCount", type: "pint", indexed: false, stored: true, required: false },
  { name: "accessedAt", type: "string", indexed: true, stored: true, required: false }
];

async function main() {
  await assertCoreExists();
  const existingFields = await getExistingFields();
  const missingFields = fields.filter((field) => !existingFields.has(field.name));

  if (missingFields.length === 0) {
    console.log(`Solr schema already has required fields for ${collection}`);
    return;
  }

  for (const field of missingFields) {
    const response = await fetch(`${solrUrl}/${collection}/schema`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "add-field": field
      })
    });

    if (!response.ok) {
      throw new Error(`Solr field setup failed for ${field.name}: ${await response.text()}`);
    }
  }

  console.log(`Added ${missingFields.length} fields to Solr collection ${collection}`);
}

async function assertCoreExists() {
  const response = await fetch(`${solrUrl}/admin/cores?action=STATUS&core=${collection}&wt=json`);

  if (!response.ok) {
    throw new Error(`Solr core check failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { status?: Record<string, unknown> };

  if (!body.status || !body.status[collection]) {
    throw new Error(`Solr core ${collection} does not exist. Run npm run services:up first.`);
  }
}

async function getExistingFields(): Promise<Set<string>> {
  const response = await fetch(`${solrUrl}/${collection}/schema/fields`);

  if (!response.ok) {
    throw new Error(`Solr schema read failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { fields?: Array<{ name: string }> };
  return new Set((body.fields ?? []).map((field) => field.name));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
