export type CognitiveFunction =
  | "Se" | "Si" | "Ne" | "Ni"
  | "Te" | "Ti" | "Fe" | "Fi";

export const COGNITIVE_FUNCTIONS: readonly CognitiveFunction[] = [
  "Se", "Si", "Ne", "Ni", "Te", "Ti", "Fe", "Fi",
] as const;

export const FUNCTION_DESCRIPTIONS: Record<CognitiveFunction, string> = {
  Se: "外倾感觉",
  Si: "内倾感觉",
  Ne: "外倾直觉",
  Ni: "内倾直觉",
  Te: "外倾思考",
  Ti: "内倾思考",
  Fe: "外倾情感",
  Fi: "内倾情感",
};

export type PersonType =
  | "self" | "friend" | "idol" | "fictional" | "other";

export const PERSON_TYPES: readonly PersonType[] = [
  "self", "friend", "idol", "fictional", "other",
] as const;

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  self: "自己",
  friend: "朋友",
  idol: "偶像",
  fictional: "虚构人物",
  other: "其他",
};

export type EvidenceDirection = "support" | "against";

export const DIRECTION_LABELS: Record<EvidenceDirection, string> = {
  support: "支持",
  against: "反证",
};

export type EvidenceStrength = 1 | 2 | 3 | 4 | 5;

export const STRENGTH_LABELS: Record<EvidenceStrength, string> = {
  1: "很弱",
  2: "较弱",
  3: "中等",
  4: "较强",
  5: "很强",
};

export type EvidenceLevel =
  | "none" | "initial" | "medium" | "much" | "rich";

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  none: "暂无证据",
  initial: "初步",
  medium: "中等",
  much: "较充分",
  rich: "丰富",
};

export type ConfidenceLabel =
  | "none" | "very_low" | "low" | "medium" | "high" | "very_high";

export const CONFIDENCE_LABELS: Record<ConfidenceLabel, string> = {
  none: "无",
  very_low: "很低",
  low: "较低",
  medium: "中等",
  high: "较高",
  very_high: "很高",
};

export type OverallTendency =
  | "none" | "support" | "against" | "balanced";

export const TENDENCY_LABELS: Record<OverallTendency, string> = {
  none: "暂无",
  support: "支持",
  against: "反向",
  balanced: "平衡",
};

export type MaterialSourceType = "manual";