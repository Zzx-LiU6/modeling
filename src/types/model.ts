import type {
  CognitiveFunction,
  PersonType,
  EvidenceDirection,
  EvidenceStrength,
  EvidenceLevel,
  ConfidenceLabel,
  OverallTendency,
  MaterialSourceType,
} from "./enums";

export interface Evidence {
  function: CognitiveFunction;
  direction: EvidenceDirection;
  strength: EvidenceStrength;
  reasoning?: string;
}

export interface Trait {
  name: string;
  description?: string;
}

export interface Material {
  id: string;
  date: string;
  source: string;
  title: string;
  content: string;
  tags: string[];
  personIds: string[];
  sourceType: MaterialSourceType;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  subjectPersonId: string | null;
  subjectLabel: string;
  title?: string;
  materialIds: string[];
  excerpt?: string;
  interpretation?: string;
  traits: Trait[];
  evidence: Evidence[];
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  type: PersonType;
  description?: string;
  birthday?: string;
  mbti?: string;
  gender?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FunctionModel {
  function: CognitiveFunction;
  supportCount: number;
  againstCount: number;
  supportWeight: number;
  againstWeight: number;
  totalWeight: number;
  netWeight: number;
  overallTendency: OverallTendency;
  evidenceLevel: EvidenceLevel;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
}

export interface PersonModel {
  personId: string;
  functions: FunctionModel[];
  computedAt: string;
}

export interface PersonStats {
  materialCount: number;
  analysisCount: number;
  traitCount: number;
  evidenceCount: number;
}

export interface MaterialFilters {
  source?: string;
  tag?: string;
  personIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface AppData {
  schemaVersion: number;
  app: { createdAt: string; updatedAt: string };
  people: Person[];
  materials: Material[];
  analyses: Analysis[];
  modelSnapshots: unknown[];
}