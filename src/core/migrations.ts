import type {
  AppData,
  Material,
  Analysis,
  Person,
  Evidence,
  Trait,
} from "../types/model";
import type {
  CognitiveFunction,
  EvidenceDirection,
  EvidenceStrength,
  PersonType,
} from "../types/enums";
import { SCHEMA_VERSION } from "./schema";

export class MigrationError extends Error {}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function readOptionalStr(x: unknown): string | undefined {
  return typeof x === "string" && x.trim() ? x.trim() : undefined;
}

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const v = t.trim();
    if (v) seen.add(v);
  }
  return Array.from(seen);
}

const readTags = readStringArray;
const readPersonIds = readStringArray;

function readEvidence(raw: unknown): Evidence[] {
  if (!Array.isArray(raw)) return [];
  const result: Evidence[] = [];
  for (const ev of raw) {
    if (!isObj(ev)) continue;
    if (
      typeof ev.function !== "string" ||
      typeof ev.direction !== "string" ||
      typeof ev.strength !== "number"
    )
      continue;
    if (ev.direction !== "support" && ev.direction !== "against") continue;
    const s = ev.strength;
    if (!Number.isInteger(s) || s < 1 || s > 5) continue;
    result.push({
      function: ev.function as CognitiveFunction,
      direction: ev.direction as EvidenceDirection,
      strength: s as EvidenceStrength,
      reasoning: typeof ev.reasoning === "string" ? ev.reasoning : undefined,
    });
  }
  return result;
}

function readTraits(raw: unknown): Trait[] {
  if (!Array.isArray(raw)) return [];
  const result: Trait[] = [];
  for (const t of raw) {
    if (!isObj(t)) continue;
    if (typeof t.name !== "string" || !t.name.trim()) continue;
    result.push({
      name: t.name.trim(),
      description:
        typeof t.description === "string" ? t.description.trim() : undefined,
    });
  }
  return result;
}

function readPerson(raw: unknown): Person | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  const person: Person = {
    id: raw.id,
    name: raw.name,
    type: (raw.type as PersonType) ?? "other",
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    birthday: readOptionalStr(raw.birthday),
    mbti: readOptionalStr(raw.mbti),
    gender: readOptionalStr(raw.gender),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
  if (raw.pinned === true) person.pinned = true;
  return person;
}

function readMaterial(raw: unknown): Material | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    date: typeof raw.date === "string" ? raw.date : "",
    source: typeof raw.source === "string" ? raw.source : "",
    title: typeof raw.title === "string" ? raw.title : "",
    content: typeof raw.content === "string" ? raw.content : "",
    tags: readTags(raw.tags),
    personIds: readPersonIds(raw.personIds),
    sourceType: "manual",
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

function readAnalysis(raw: unknown): Analysis | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== "string") return null;
  const subjectPersonId =
    typeof raw.subjectPersonId === "string" && raw.subjectPersonId
      ? raw.subjectPersonId
      : null;
  const subjectLabel =
    typeof raw.subjectLabel === "string" && raw.subjectLabel
      ? raw.subjectLabel
      : "（未知）";
  const materialIds: string[] = Array.isArray(raw.materialIds)
    ? (raw.materialIds as unknown[]).filter(
        (x): x is string => typeof x === "string"
      )
    : [];
  return {
    id: raw.id,
    subjectPersonId,
    subjectLabel,
    title: typeof raw.title === "string" ? raw.title : undefined,
    materialIds,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
    interpretation:
      typeof raw.interpretation === "string" ? raw.interpretation : undefined,
    traits: readTraits(raw.traits),
    evidence: readEvidence(raw.evidence),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

function readArray<T>(raw: unknown, reader: (x: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    const v = reader(item);
    if (v) out.push(v);
  }
  return out;
}

function buildApp(
  version: number,
  people: Person[],
  materials: Material[],
  analyses: Analysis[],
  appRaw: unknown
): AppData {
  const app = isObj(appRaw) ? appRaw : {};
  return {
    schemaVersion: version,
    app: {
      createdAt:
        typeof app.createdAt === "string"
          ? app.createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    people,
    materials,
    analyses,
    modelSnapshots: [],
  };
}

/* ---------- v1 → v2 ---------- */

export function migrateV1ToV2(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("旧版数据不是有效对象。");
  const peopleRaw = input.people;
  const observationsRaw = input.observations;
  if (!Array.isArray(peopleRaw) || !Array.isArray(observationsRaw)) {
    throw new MigrationError("旧版数据缺少 people / observations。");
  }

  const people: Person[] = [];
  for (const p of peopleRaw) {
    const person = readPerson(p);
    if (person) people.push(person);
  }

  const materials: Material[] = [];
  const analyses: Analysis[] = [];

  for (const obs of observationsRaw) {
    if (!isObj(obs)) continue;
    const obsId = typeof obs.id === "string" ? obs.id : "unknown";
    const personId = typeof obs.personId === "string" ? obs.personId : "";
    const person = people.find((p) => p.id === personId);
    if (!person) continue;

    const now = new Date().toISOString();
    const createdAt = typeof obs.createdAt === "string" ? obs.createdAt : now;
    const updatedAt = typeof obs.updatedAt === "string" ? obs.updatedAt : now;
    const date =
      typeof obs.date === "string" && obs.date
        ? obs.date
        : createdAt.slice(0, 10);
    const source = typeof obs.source === "string" ? obs.source : "";
    const content = typeof obs.content === "string" ? obs.content : "";

    const materialId = `material_migrated_${obsId}`;
    const analysisId = `analysis_migrated_${obsId}`;

    materials.push({
      id: materialId,
      date,
      source,
      title: `[旧版观察] ${source || date}`,
      content,
      tags: [],
      personIds: [personId],
      sourceType: "manual",
      createdAt,
      updatedAt,
    });

    const interpParts: string[] = [];
    if (typeof obs.judgmentNote === "string" && obs.judgmentNote)
      interpParts.push(obs.judgmentNote);
    if (typeof obs.globalCaveat === "string" && obs.globalCaveat)
      interpParts.push(`保留意见：${obs.globalCaveat}`);

    analyses.push({
      id: analysisId,
      subjectPersonId: personId,
      subjectLabel: person.name,
      title: undefined,
      materialIds: [materialId],
      excerpt: undefined,
      interpretation: interpParts.join("\n") || "（从旧版观察自动迁移）",
      traits: [],
      evidence: readEvidence(obs.evidence),
      createdAt,
      updatedAt,
    });
  }

  return buildApp(2, people, materials, analyses, input.app);
}

/* ---------- v2 → v3 ---------- */

export function migrateV2ToV3(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("v2 数据不是有效对象。");
  const people = readArray(input.people, readPerson);
  const materials = readArray(input.materials, readMaterial);
  const personIds = new Set(people.map((p) => p.id));
  const materialIds = new Set(materials.map((m) => m.id));

  const analysesRaw = Array.isArray(input.analyses) ? input.analyses : [];
  const analyses: Analysis[] = [];
  for (const a of analysesRaw) {
    if (!isObj(a)) continue;
    const oldSubject =
      typeof a.subjectPersonId === "string" ? a.subjectPersonId : null;
    const subjectExists = !!oldSubject && personIds.has(oldSubject);
    const subjectPersonId = subjectExists ? oldSubject : null;
    const oldMaterialId =
      typeof a.materialId === "string" ? a.materialId : null;
    const newMaterialIds: string[] =
      oldMaterialId && materialIds.has(oldMaterialId) ? [oldMaterialId] : [];
    const person = subjectExists
      ? people.find((p) => p.id === oldSubject)
      : undefined;
    const subjectLabel = person ? person.name : "（未知）";

    analyses.push({
      id: typeof a.id === "string" ? a.id : `analysis_${Date.now()}`,
      subjectPersonId,
      subjectLabel,
      title: undefined,
      materialIds: newMaterialIds,
      excerpt: typeof a.excerpt === "string" ? a.excerpt : undefined,
      interpretation:
        typeof a.interpretation === "string" ? a.interpretation : undefined,
      traits: [],
      evidence: readEvidence(a.evidence),
      createdAt:
        typeof a.createdAt === "string" ? a.createdAt : new Date().toISOString(),
      updatedAt:
        typeof a.updatedAt === "string" ? a.updatedAt : new Date().toISOString(),
    });
  }

  return buildApp(3, people, materials, analyses, input.app);
}

/* ---------- v3 → v4 ---------- */

export function migrateV3ToV4(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("v3 数据不是有效对象。");
  const people = readArray(input.people, readPerson);
  const materials = readArray(input.materials, readMaterial);
  const analyses = readArray(input.analyses, readAnalysis);
  return buildApp(4, people, materials, analyses, input.app);
}

/* ---------- v4 → v5 ---------- */

export function migrateV4ToV5(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("v4 数据不是有效对象。");
  const people = readArray(input.people, readPerson);
  const materials = readArray(input.materials, readMaterial);
  const analyses = readArray(input.analyses, readAnalysis);
  return buildApp(5, people, materials, analyses, input.app);
}

/* ---------- v5 → v6 ---------- */

export function migrateV5ToV6(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("v5 数据不是有效对象。");
  const people = readArray(input.people, readPerson);
  const materials = readArray(input.materials, readMaterial);
  const analyses = readArray(input.analyses, readAnalysis);
  return buildApp(6, people, materials, analyses, input.app);
}

/* ---------- v6 → v7 ---------- */

export function migrateV6ToV7(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("v6 数据不是有效对象。");
  const people = readArray(input.people, readPerson);
  const materials = readArray(input.materials, readMaterial);
  const analyses = readArray(input.analyses, readAnalysis);
  return buildApp(SCHEMA_VERSION, people, materials, analyses, input.app);
}

/* ---------- 统一入口 ---------- */

export function migrateToCurrent(input: unknown): AppData {
  if (!isObj(input)) throw new MigrationError("数据不是有效对象。");
  const version =
    typeof input.schemaVersion === "number" ? input.schemaVersion : 0;

  if (version === SCHEMA_VERSION) return input as unknown as AppData;

  let current: AppData;
  if (version === 1) current = migrateV1ToV2(input);
  else if (version === 2) current = input as unknown as AppData;
  else if (version === 3) current = input as unknown as AppData;
  else if (version === 4) current = input as unknown as AppData;
  else if (version === 5) current = input as unknown as AppData;
  else if (version === 6) current = input as unknown as AppData;
  else
    throw new MigrationError(
      `不支持的 schemaVersion：${String(version)}。当前版本 ${SCHEMA_VERSION}。`
    );

  if (current.schemaVersion === 2) current = migrateV2ToV3(current);
  if (current.schemaVersion === 3) current = migrateV3ToV4(current);
  if (current.schemaVersion === 4) current = migrateV4ToV5(current);
  if (current.schemaVersion === 5) current = migrateV5ToV6(current);
  if (current.schemaVersion === 6) current = migrateV6ToV7(current);
  return current;
}