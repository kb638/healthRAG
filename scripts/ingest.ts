import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import type {
  DocumentSection,
  NormalizedDocument,
  SourceMetadata
} from "@healthwise/shared";

const rootDir = process.cwd();
const sourcesPath = resolve(rootDir, "data/sources/sources.json");
const documentsPath = resolve(rootDir, "data/processed/documents.json");

const minLineLength = 18;

const cutoffHeadingPattern =
  /^(start here|learn more|see, play and learn|research|resources|for you|topic image|medical encyclopedia|related health topics|national institutes of health|other languages|disclaimers|references|external links|related pages|more information|site index)$/i;

const preContentNavigationHeadingPattern =
  /^(basics|learn more|see, play and learn|research|resources|for you)$/i;

const navigationTextPattern =
  /^(skip navigation|skip directly|search|menu|go|home|you are here|on this page|español|browse drugs and medicines|learn how to cite this page|subscribe to rss|connect with|viewers & players|accessibility|customer support|what's new|site map)$/i;

async function main() {
  const sources = await readSources();
  const documents: NormalizedDocument[] = [];

  for (const source of sources) {
    console.log(`Ingesting ${source.id} from ${source.sourceName}`);
    const html = await fetchSourceHtml(source);
    const document = normalizeDocument(source, html);
    validateDocument(document);
    documents.push(document);
  }

  await mkdir(dirname(documentsPath), { recursive: true });
  await writeFile(documentsPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");

  const sectionCount = documents.reduce((sum, document) => sum + document.sections.length, 0);
  console.log(`Wrote ${documents.length} documents and ${sectionCount} sections to ${documentsPath}`);
}

async function readSources(): Promise<SourceMetadata[]> {
  const raw = await readFile(sourcesPath, "utf8");
  const parsed = JSON.parse(raw) as SourceMetadata[];

  if (!Array.isArray(parsed) || parsed.length < 8) {
    throw new Error("Expected at least 8 source records in data/sources/sources.json");
  }

  for (const source of parsed) {
    validateSource(source);
  }

  return parsed;
}

function validateSource(source: SourceMetadata) {
  const requiredFields: Array<keyof SourceMetadata> = [
    "id",
    "title",
    "sourceName",
    "sourceUrl",
    "topic",
    "contentType",
    "accessedAt",
    "trustLevel"
  ];

  for (const field of requiredFields) {
    if (!source[field]) {
      throw new Error(`Source ${source.id || "(missing id)"} is missing ${field}`);
    }
  }

  if (source.contentType !== "html") {
    throw new Error(`Source ${source.id} has unsupported contentType ${source.contentType}`);
  }

  if (source.trustLevel !== "public-medical-source") {
    throw new Error(`Source ${source.id} must be marked as public-medical-source`);
  }
}

async function fetchSourceHtml(source: SourceMetadata): Promise<string> {
  const response = await fetch(source.sourceUrl, {
    headers: {
      "User-Agent": "HealthWiseRAGDemo/0.1 educational ingestion"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.sourceUrl}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function normalizeDocument(source: SourceMetadata, html: string): NormalizedDocument {
  const $ = load(html);
  removeNonContentElements($);

  const contentRoot = selectContentRoot($);
  const pageTitle = normalizeText(contentRoot.find("h1").first().text()) || source.title;
  const sections = extractSections($, contentRoot, pageTitle);

  if (sections.length === 0) {
    console.warn(
      `No sections extracted for ${source.id}. rootText=${normalizeText(contentRoot.text()).length}, headings=${contentRoot.find("h1,h2,h3,h4").length}, paragraphs=${contentRoot.find("p").length}, listItems=${contentRoot.find("li").length}`
    );
    console.warn(
      contentRoot
        .find("h1,h2,h3,h4")
        .slice(0, 12)
        .map((_index, element) => cleanElementText($, element))
        .get()
    );
  }

  return {
    id: source.id,
    title: source.title || pageTitle,
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    topic: source.topic,
    accessedAt: source.accessedAt,
    sections
  };
}

function removeNonContentElements($: CheerioAPI) {
  $(
    [
      "script",
      "style",
      "noscript",
      "svg",
      "img",
      "picture",
      "figure",
      "iframe",
      "form",
      "button",
      "input",
      "select",
      "nav",
      "header",
      "footer",
      "aside",
      "[aria-hidden='true']",
      ".usa-banner",
      ".breadcrumb",
      ".breadcrumbs",
      ".site-footer",
      ".related-pages",
      ".related-content"
    ].join(",")
  ).remove();
}

function selectContentRoot($: CheerioAPI): Cheerio<AnyNode> {
  const selectors = [
    "main",
    "article",
    "[role='main']",
    "#main",
    "#content",
    ".main-content",
    ".content",
    "body"
  ];
  let bestCandidate: Cheerio<AnyNode> = $("body").first();
  let bestScore = scoreContentCandidate(bestCandidate);

  for (const selector of selectors) {
    $(selector).each((_index, element) => {
      const candidate = $(element);
      const score = scoreContentCandidate(candidate);

      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    });
  }

  return bestCandidate;
}

function scoreContentCandidate(candidate: Cheerio<AnyNode>): number {
  const textLength = normalizeText(candidate.text()).length;
  const paragraphCount = candidate.find("p").length;
  const headingCount = candidate.find("h1,h2,h3,h4").length;

  return textLength + paragraphCount * 200 + headingCount * 80;
}

function extractSections(
  $: CheerioAPI,
  contentRoot: Cheerio<AnyNode>,
  pageTitle: string
): DocumentSection[] {
  const sections: DocumentSection[] = [];
  let currentHeading = "Summary";
  let currentLines: string[] = [];
  let stopReading = false;

  function flushSection() {
    const text = normalizeSectionText(currentLines);

    if (text.length >= 120) {
      sections.push({
        heading: currentHeading,
        text
      });
    }

    currentLines = [];
  }

  contentRoot.find("h1,h2,h3,h4,p,li").each((_index, element) => {
    if (stopReading) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const text = cleanElementText($, element);

    if (!text) {
      return;
    }

    if (/^h[1-4]$/.test(tagName)) {
      if (navigationTextPattern.test(text)) {
        return;
      }

      if (isSameHeading(text, pageTitle)) {
        return;
      }

      if (sections.length === 0 && preContentNavigationHeadingPattern.test(text)) {
        currentLines = [];
        return;
      }

      if (cutoffHeadingPattern.test(text)) {
        if (sections.length > 0) {
          flushSection();
          stopReading = true;
          return false;
        }

        currentLines = [];
        return;
      }

      flushSection();
      currentHeading = text;
      return;
    }

    if (shouldSkipText(text)) {
      return;
    }

    currentLines.push(tagName === "li" ? `- ${text}` : text);
  });

  flushSection();

  return dedupeSections(sections);
}

function cleanElementText($: CheerioAPI, element: AnyNode): string {
  const clone = $(element).clone();
  clone.find("sup,script,style,noscript,svg,img,button").remove();
  return normalizeText(clone.text());
}

function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizeSectionText(lines: string[]): string {
  const uniqueLines: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const normalized = normalizeText(line);
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      uniqueLines.push(normalized);
      seen.add(key);
    }
  }

  return uniqueLines.join("\n");
}

function shouldSkipText(text: string): boolean {
  const normalized = normalizeText(text);

  if (normalized.length < minLineLength) {
    return true;
  }

  if (navigationTextPattern.test(normalized)) {
    return true;
  }

  if (/^url of this page:/i.test(normalized)) {
    return true;
  }

  if (/^last (updated|reviewed|revised)/i.test(normalized)) {
    return true;
  }

  if (/official websites use \.gov/i.test(normalized)) {
    return true;
  }

  if (/secure \.gov websites use https/i.test(normalized)) {
    return true;
  }

  return false;
}

function isSameHeading(a: string, b: string): boolean {
  return normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
}

function dedupeSections(sections: DocumentSection[]): DocumentSection[] {
  const seen = new Set<string>();
  const deduped: DocumentSection[] = [];

  for (const section of sections) {
    const key = `${section.heading.toLowerCase()}::${section.text.slice(0, 180).toLowerCase()}`;

    if (!seen.has(key)) {
      deduped.push(section);
      seen.add(key);
    }
  }

  return deduped;
}

function validateDocument(document: NormalizedDocument) {
  if (!document.title || !document.sourceUrl || !document.sourceName) {
    throw new Error(`Document ${document.id} is missing required metadata`);
  }

  if (document.sections.length === 0) {
    throw new Error(`Document ${document.id} did not produce any sections`);
  }

  for (const section of document.sections) {
    if (!section.heading || section.text.length < 120) {
      throw new Error(`Document ${document.id} has an invalid section`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
