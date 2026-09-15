import type {
  AppData,
  Person,
  Material,
  Analysis,
  Evidence,
  Trait,
} from "../types/model";
import type {
  CognitiveFunction,
  PersonType,
  EvidenceDirection,
  EvidenceStrength,
} from "../types/enums";
import { COGNITIVE_FUNCTIONS, PERSON_TYPES } from "../types/enums";
import { SCHEMA_VERSION } from "./schema";
import { migrateToCurrent, MigrationError } from "./migrations";

export interface ValidationResult {
  data?: AppData;
  errors: string[];
  notice?: string;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

const MAX_TAG_LENGTH = 40;
const MAX_TAGS_PER_MATERIAL = 30;

function normalizeStringArray(raw: unknown, label: string): {
  values: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const values: string[] = [];
  if (raw === undefined) return { values, errors };
  if (!Array.isArray(raw)) {
    errors.push(`${label} 不是数组。`);
    return { values, errors };
  }
  const seen = new Set<string>();
  for (const t of raw) {
    if (typeof t !== "string") {
      errors.push(`${label} 中存在非字符串项。`);
      continue;
    }
    const v = t.trim();
    if (!v) continue;
    if (v.length > MAX_TAG_LENGTH) {
      errors.push(`${label} 过长：${v.slice(0, 10)}…`);
      continue;
    }
    if (seen.has(v)) continue;
    seen.add(v);
    values.push(v);
  }
  if (label === "tags" && values.length > MAX_TAGS_PER_MATERIAL) {
    errors.push(`单份材料最多 ${MAX_TAGS_PER_MATERIAL} 个标签。`);
  }
  return { values, errors };
}

export function validateAppData(input: unknown): ValidationResult {
  if (!isObj(input)) return { errors: ["导入数据不是有效对象。"] };

  if (typeof input.schemaVersion !== "number") {
    return { errors: ["缺少 schemaVersion 字段。"] };
  }

  let candidate: AppData;
  let notice: string | undefined;

  if (input.schemaVersion !== SCHEMA_VERSION) {
    try {
      candidate = migrateToCurrent(input);
      notice = `导入数据为旧版 schemaVersion ${input.schemaVersion}，已自动迁移到 v${SCHEMA_VERSION}。`;
    } catch (e) {
      const msg =
        e instanceof MigrationError
          ? e.message
          : "旧版数据迁移失败：" + (e as Error).message;
      return { errors: [msg] };
    }
  } else {
    candidate = input as unknown as AppData;
  }

  const errors: string[] = [];
  if (!isObj(candidate.app)) errors.push("缺少 app 字段。");
  if (!Array.isArray(candidate.people)) errors.push("people 不是数组。");
  if (!Array.isArray(candidate.materials)) errors.push("materials 不是数组。");
  if (!Array.isArray(candidate.analyses)) errors.push("analyses 不是数组。");
  if (errors.length) return { errors };

  /* people */
  const people: Person[] = [];
  const personIds = new Set<string>();
  for (const raw of candidate.people) {
    if (!isObj(raw)) {
      errors.push("发现无效人物条目。");
      continue;
    }
    if (typeof raw.id !== "string" || !raw.id) {
      errors.push("人物缺少有效 id。");
      continue;
    }
    if (personIds.has(raw.id)) {
      errors.push(`人物 id 重复：${raw.id}。`);
      continue;
    }
    if (typeof raw.name !== "string") {
      errors.push(`人物 ${raw.id} 缺少 name。`);
      continue;
    }
    if (!PERSON_TYPES.includes(raw.type as PersonType)) {
      errors.push(`人物 ${raw.id} 的 type 无效。`);
      continue;
    }
    if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
      errors.push(`人物 ${raw.id} 缺少时间字段。`);
      continue;
    }
    const person: Person = {
      id: raw.id,
      name: raw.name,
      type: raw.type as PersonType,
      description:
        typeof raw.description === "string" ? raw.description : undefined,
      birthday: typeof raw.birthday === "string" ? raw.birthday : undefined,
      mbti: typeof raw.mbti === "string" ? raw.mbti : undefined,
      gender: typeof raw.gender === "string" ? raw.gender : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    if (raw.pinned === true) person.pinned = true;
    personIds.add(raw.id);
    people.push(person);
  }

  /* materials */
  const materials: Material[] = [];
  const materialIds = new Set<string>();
  for (const raw of candidate.materials) {
    if (!isObj(raw)) {
      errors.push("发现无效材料条目。");
      continue;
    }
    if (typeof raw.id !== "string" || !raw.id) {
      errors.push("材料缺少有效 id。");
      continue;
    }
    if (materialIds.has(raw.id)) {
      errors.push(`材料 id 重复：${raw.id}。`);
      continue;
    }
    if (
      typeof raw.date !== "string" ||
      typeof raw.source !== "string" ||
      typeof raw.title !== "string" ||
      typeof raw.content !== "string"
    ) {
      errors.push(`材料 ${raw.id} 缺少必要字段。`);
      continue;
    }
    if (raw.sourceType !== "manual") {
      errors.push(`材料 ${raw.id} 的 sourceType 无效。`);
      continue;
    }
    if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
      errors.push(`材料 ${raw.id} 缺少时间字段。`);
      continue;
    }

    const tagResult = normalizeStringArray(raw.tags, "tags");
    if (tagResult.errors.length) {
      errors.push(`材料 ${raw.id}：${tagResult.errors.join(" / ")}`);
      continue;
    }

    const personIdResult = normalizeStringArray(raw.personIds, "personIds");
    if (personIdResult.errors.length) {
      errors.push(`材料 ${raw.id}：${personIdResult.errors.join(" / ")}`);
      continue;
    }
    let matPersonOk = true;
    for (const pid of personIdResult.values) {
      if (!personIds.has(pid)) {
        errors.push(`材料 ${raw.id} 引用了不存在的人物：${pid}。`);
        matPersonOk = false;
        break;
      }
    }
    if (!matPersonOk) continue;

    materialIds.add(raw.id);
    materials.push({
      id: raw.id,
      date: raw.date,
      source: raw.source,
      title: raw.title,
      content: raw.content,
      tags: tagResult.values,
      personIds: personIdResult.values,
      sourceType: "manual",
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /* analyses */
  const analyses: Analysis[] = [];
  const analysisIds = new Set<string>();
  for (const raw of candidate.analyses) {
    if (!isObj(raw)) {
      errors.push("发现无效研究条目。");
      continue;
    }
    if (typeof raw.id !== "string" || !raw.id) {
      errors.push("研究缺少有效 id。");
      continue;
    }
    if (analysisIds.has(raw.id)) {
      errors.push(`研究 id 重复：${raw.id}。`);
      continue;
    }

    let subjectPersonId: string | null = null;
    let subjectLabel: string;
    if (raw.subjectPersonId === null) {
      if (typeof raw.subjectLabel !== "string" || !raw.subjectLabel) {
        errors.push(`研究 ${raw.id} 的 subjectLabel 缺失。`);
        continue;
      }
      subjectLabel = raw.subjectLabel;
    } else if (typeof raw.subjectPersonId === "string") {
      if (!personIds.has(raw.subjectPersonId)) {
        errors.push(`研究 ${raw.id} 的 subjectPersonId 不存在。`);
        continue;
      }
      subjectPersonId = raw.subjectPersonId;
      const person = people.find((p) => p.id === raw.subjectPersonId);
      subjectLabel =
        typeof raw.subjectLabel === "string" && raw.subjectLabel
          ? raw.subjectLabel
          : person!.name;
    } else {
      errors.push(`研究 ${raw.id} 的 subjectPersonId 类型无效。`);
      continue;
    }

    if (!Array.isArray(raw.materialIds)) {
      errors.push(`研究 ${raw.id} 的 materialIds 不是数组。`);
      continue;
    }
    const analysisMaterialIds: string[] = [];
    let matOk = true;
    for (const mid of raw.materialIds) {
      if (typeof mid !== "string" || !materialIds.has(mid)) {
        errors.push(`研究 ${raw.id} 引用了不存在的材料。`);
        matOk = false;
        break;
      }
      analysisMaterialIds.push(mid);
    }
    if (!matOk) continue;

    if (!Array.isArray(raw.evidence)) {
      errors.push(`研究 ${raw.id} 的 evidence 不是数组。`);
      continue;
    }
    const evidence: Evidence[] = [];
    const seenFn = new Set<CognitiveFunction>();
    let evOk = true;
    for (const ev of raw.evidence) {
      if (!isObj(ev)) {
        errors.push(`研究 ${raw.id} 中存在无效 evidence。`);
        evOk = false;
        break;
      }
      if (!COGNITIVE_FUNCTIONS.includes(ev.function as CognitiveFunction)) {
        errors.push(`研究 ${raw.id} 的 evidence.function 无效。`);
        evOk = false;
        break;
      }
      if (ev.direction !== "support" && ev.direction !== "against") {
        errors.push(`研究 ${raw.id} 的 evidence.direction 无效。`);
        evOk = false;
        break;
      }
      const s = ev.strength;
      if (typeof s !== "number" || !Number.isInteger(s) || s < 1 || s > 5) {
        errors.push(`研究 ${raw.id} 的 evidence.strength 无效。`);
        evOk = false;
        break;
      }
      const fn = ev.function as CognitiveFunction;
      if (seenFn.has(fn)) {
        errors.push(`研究 ${raw.id} 中功能 ${fn} 重复出现。`);
        evOk = false;
        break;
      }
      seenFn.add(fn);
      evidence.push({
        function: fn,
        direction: ev.direction as EvidenceDirection,
        strength: s as EvidenceStrength,
        reasoning: typeof ev.reasoning === "string" ? ev.reasoning : undefined,
      });
    }
    if (!evOk) continue;

    if (!Array.isArray(raw.traits)) {
      errors.push(`研究 ${raw.id} 的 traits 不是数组。`);
      continue;
    }
    const traits: Trait[] = [];
    let traitOk = true;
    for (const t of raw.traits) {
      if (!isObj(t)) {
        errors.push(`研究 ${raw.id} 中存在无效 trait。`);
        traitOk = false;
        break;
      }
      if (typeof t.name !== "string" || !t.name.trim()) {
        errors.push(`研究 ${raw.id} 的 trait 缺少 name。`);
        traitOk = false;
        break;
      }
      traits.push({
        name: t.name.trim(),
        description:
          typeof t.description === "string" ? t.description.trim() : undefined,
      });
    }
    if (!traitOk) continue;

    if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
      errors.push(`研究 ${raw.id} 缺少时间字段。`);
      continue;
    }

    analysisIds.add(raw.id);
    analyses.push({
      id: raw.id,
      subjectPersonId,
      subjectLabel,
      title: typeof raw.title === "string" ? raw.title : undefined,
      materialIds: analysisMaterialIds,
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
      interpretation:
        typeof raw.interpretation === "string" ? raw.interpretation : undefined,
      traits,
      evidence,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  if (errors.length) return { errors };

  const appRaw = candidate.app;
  return {
    data: {
      schemaVersion: SCHEMA_VERSION,
      app: {
        createdAt:
          typeof appRaw.createdAt === "string"
            ? appRaw.createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      people,
      materials,
      analyses,
      modelSnapshots: [],
    },
    errors: [],
    notice,
  };
}

export function exportAppData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}