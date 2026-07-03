import type { SafetyLevel } from "@healthwise/shared";

const urgentPatterns = [
  /\bchest pain\b/i,
  /\btrouble breathing\b/i,
  /\bdifficulty breathing\b/i,
  /\bsevere allergic reaction\b/i,
  /\bstroke\b/i,
  /\bsuicidal\b/i,
  /\bsuicide\b/i,
  /\boverdose\b/i,
  /\bsevere bleeding\b/i,
  /\bheart attack\b/i
];

const diagnosisSeekingPatterns = [
  /\bdo i have\b/i,
  /\bam i having\b/i,
  /\bwhat disease do i have\b/i,
  /\bdiagnose me\b/i,
  /\bdo you think i have\b/i,
  /\bis this\b.*\b(diabetes|asthma|flu|depression|stroke|heart attack)\b/i
];

const medicationAdvicePatterns = [
  /\bhow much\b.*\b(ibuprofen|acetaminophen|medicine|medication|drug)\b/i,
  /\bcan i (take|mix|combine)\b.*\b(ibuprofen|acetaminophen|medicine|medication|drug)\b/i,
  /\bdosage\b/i,
  /\bdose\b/i,
  /\bside effects?\b/i
];

export function classifySafetyLevel(query: string): SafetyLevel {
  if (urgentPatterns.some((pattern) => pattern.test(query))) {
    return "urgent";
  }

  if (diagnosisSeekingPatterns.some((pattern) => pattern.test(query))) {
    return "diagnosis-seeking";
  }

  if (medicationAdvicePatterns.some((pattern) => pattern.test(query))) {
    return "medication-advice";
  }

  return "educational";
}

export function safetyGuidanceFor(level: SafetyLevel): string {
  switch (level) {
    case "urgent":
      return "I cannot help evaluate an emergency. If this may be urgent, call emergency services or seek immediate medical care.";
    case "diagnosis-seeking":
      return "I cannot diagnose you. I can share general educational information from sources, and you should consult a qualified clinician for personal medical concerns.";
    case "medication-advice":
      return "I cannot provide personalized medication dosing or interaction advice. For medication questions, read the label and ask a clinician or pharmacist.";
    case "unsupported":
      return "The retrieved sources do not support an answer to this question.";
    case "educational":
      return "This is educational information and not medical advice.";
  }
}

export const medicalDisclaimer = "This is educational information and not medical advice.";
