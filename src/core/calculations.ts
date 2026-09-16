import type {
  Analysis,
  Material,
  FunctionModel,
  PersonModel,
  PersonStats,
} from "../types/model";
import type {
  CognitiveFunction,
  EvidenceLevel,
  ConfidenceLabel,
  OverallTendency,
} from "../types/enums";
import { COGNITIVE_FUNCTIONS } from "../types/enums";

export function getEvidenceLevel(totalWeight: number): EvidenceLevel {
  if (totalWeight <= 0) return "none";
  if (totalWeight <= 4) return "initial";
  if (totalWeight <= 9) return "medium";
  if (totalWeight <= 19) return "much";
  return "rich";
}

export function getConfidenceLabel(score: number): ConfidenceLabel {
  if (score <= 0) return "none";
  if (score <= 24) return "very_low";
  if (score <= 44) return "low";
  if (score <= 64) return "medium";
  if (score <= 84) return "high";
  return "very_high";
}

export function computeFunctionModel(
  fn: CognitiveFunction,
  analyses: Analysis[]
): FunctionModel {
  let supportCount = 0;
  let againstCount = 0;
  let supportWeight = 0;
  let againstWeight = 0;

  for (const a of analyses) {
    for (const ev of a.evidence) {
      if (ev.function !== fn) continue;
      if (ev.direction === "support") {
        supportCount++;
        supportWeight += ev.strength;
      } else {
        againstCount++;
        againstWeight += ev.strength;
      }
    }
  }

  const totalWeight = supportWeight + againstWeight;
  const netWeight = supportWeight - againstWeight;

  let overallTendency: OverallTendency;
  if (totalWeight === 0) overallTendency = "none";
  else if (netWeight > 0) overallTendency = "support";
  else if (netWeight < 0) overallTendency = "against";
  else overallTendency = "balanced";

  let confidenceScore = 0;
  if (totalWeight > 0) {
    const directionScore = netWeight / totalWeight;
    const volumeScore = totalWeight / (totalWeight + 10);
    const raw = 100 * directionScore * volumeScore;
    confidenceScore = Math.max(0, Math.round(raw));
  }

  return {
    function: fn,
    supportCount,
    againstCount,
    supportWeight,
    againstWeight,
    totalWeight,
    netWeight,
    overallTendency,
    evidenceLevel: getEvidenceLevel(totalWeight),
    confidenceScore,
    confidenceLabel: getConfidenceLabel(confidenceScore),
  };
}

export function computePersonModel(
  personId: string,
  analyses: Analysis[]
): PersonModel {
  const personAnalyses = analyses.filter(
    (a) => a.subjectPersonId === personId
  );
  const functions = COGNITIVE_FUNCTIONS.map((fn) =>
    computeFunctionModel(fn, personAnalyses)
  );
  return {
    personId,
    functions,
    computedAt: new Date().toISOString(),
  };
}

/**
 * V0.6：材料数基于 Material.personIds，其他仍来自 Research。
 */
export function computePersonStats(
  personId: string,
  materials: Material[],
  analyses: Analysis[]
): PersonStats {
  const relatedMaterials = materials.filter((m) =>
    m.personIds.includes(personId)
  );
  const personAnalyses = analyses.filter(
    (a) => a.subjectPersonId === personId
  );
  let traitCount = 0;
  let evidenceCount = 0;
  for (const a of personAnalyses) {
    traitCount += a.traits.length;
    evidenceCount += a.evidence.length;
  }
  return {
    materialCount: relatedMaterials.length,
    analysisCount: personAnalyses.length,
    traitCount,
    evidenceCount,
  };
}