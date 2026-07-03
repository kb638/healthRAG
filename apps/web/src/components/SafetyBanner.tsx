import { AlertTriangle, ShieldCheck } from "lucide-react";

import type { SafetyLevel } from "@healthwise/shared";

type SafetyBannerProps = {
  safetyLevel?: SafetyLevel;
  disclaimer: string;
};

const safetyMessages: Record<SafetyLevel, string> = {
  educational: "The answer should stay general, cited, and source-grounded.",
  "diagnosis-seeking":
    "This sounds diagnosis-related, so the answer stays general and cannot evaluate personal symptoms.",
  "medication-advice":
    "Medication decisions can depend on medical history, age, and other medicines. Use this only as general information.",
  urgent:
    "Urgent symptoms need immediate professional help. This app skips normal retrieval for emergency-intent questions.",
  unsupported: "The indexed sources did not support a grounded answer for this question."
};

export function SafetyBanner({ safetyLevel = "educational", disclaimer }: SafetyBannerProps) {
  const isEducational = safetyLevel === "educational";
  const Icon = isEducational ? ShieldCheck : AlertTriangle;

  return (
    <aside
      className={`safety-banner safety-banner--${safetyLevel}`}
      role={isEducational ? "note" : "alert"}
    >
      <Icon aria-hidden="true" size={20} />
      <div>
        <strong>{isEducational ? "Educational use" : safetyLabel(safetyLevel)}</strong>
        <p>
          {disclaimer} {safetyMessages[safetyLevel]}
        </p>
      </div>
    </aside>
  );
}

function safetyLabel(level: SafetyLevel) {
  switch (level) {
    case "diagnosis-seeking":
      return "Diagnosis boundary";
    case "medication-advice":
      return "Medication boundary";
    case "urgent":
      return "Urgent safety response";
    case "unsupported":
      return "Unsupported by sources";
    case "educational":
      return "Educational use";
  }
}
