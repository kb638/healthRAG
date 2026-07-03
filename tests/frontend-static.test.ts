import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const webSrcDir = resolve(process.cwd(), "apps/web/src");

describe("React UI static smoke checks", () => {
  it("wires the main Phase 06 components into the app", async () => {
    const appSource = await readFile(resolve(webSrcDir, "App.tsx"), "utf8");

    for (const componentName of [
      "ApiStatus",
      "QueryForm",
      "ExampleQuestions",
      "SafetyBanner",
      "AnswerPanel",
      "SourceCard",
      "RetrievalDetails"
    ]) {
      expect(appSource).toContain(componentName);
    }
  });

  it("keeps basic accessibility contracts in the UI components", async () => {
    const [queryForm, answerPanel, apiStatus] = await Promise.all([
      readFile(resolve(webSrcDir, "components/QueryForm.tsx"), "utf8"),
      readFile(resolve(webSrcDir, "components/AnswerPanel.tsx"), "utf8"),
      readFile(resolve(webSrcDir, "components/ApiStatus.tsx"), "utf8")
    ]);

    expect(queryForm).toContain('htmlFor="query"');
    expect(queryForm).toContain('htmlFor="topic-filter"');
    expect(answerPanel).toContain('role="status"');
    expect(answerPanel).toContain('role="alert"');
    expect(apiStatus).toContain('aria-live="polite"');
  });
});
