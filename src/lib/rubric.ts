import type { RubricCriterion } from "./types";

export const rubricLevelOrder = ["Favorable", "Acceptable", "Marginal", "Unacceptable"] as const;

export type RubricDisplayLabel = (typeof rubricLevelOrder)[number];

const legacyLabelMap: Record<string, RubricDisplayLabel> = {
  Excellent: "Favorable",
  Proficient: "Acceptable",
  Developing: "Marginal",
  Beginning: "Unacceptable"
};

export function getRubricDisplayLabel(label: string): RubricDisplayLabel {
  return legacyLabelMap[label] ?? (label as RubricDisplayLabel);
}

export function getRubricLevel(criterion: RubricCriterion, displayLabel: RubricDisplayLabel) {
  return criterion.levels.find((level) => getRubricDisplayLabel(level.label) === displayLabel);
}
