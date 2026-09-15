import type {
  AppData,
  Person,
  Material,
  Analysis,
  Evidence,
  Trait,
  MaterialFilters,
} from "./types/model";
import type { PersonType } from "./types/enums";
import { loadData, saveData, clearData } from "./core/storage";
import { createEmptyAppData } from "./core/schema";
import { generateId } from "./utils/id";

type Listener = () => void;

export interface NewPersonInput {
  name: string;
  type: PersonType;
  description?: string;
  birthday?: string;
  mbti?: string;
  gender?: string;
}

export type UpdatePersonInput = NewPersonInput;

export interface NewMaterialInput {
  date: string;
  source: string;
  title: string;
  content: string;
  tags?: string[];
  personIds?: string[];
}

export type UpdateMaterialInput = NewMaterialInput;

export interface NewAnalysisInput {
  subjectPersonId: string;
  title?: string;
  materialIds: string[];
  excerpt?: string;
  interpretation?: string;
  traits: Trait[];
  evidence: Evidence[];
}

export interface UpdateAnalysisInput {
  subjectPersonId: string | null;
  title?: string;
  materialIds: string[];
  excerpt?: string;
  interpretation?: string;
  traits: Trait[];
  evidence: Evidence[];
}

function normalizeStringArray(input?: string[]): string[] {
  if (!input) return [];
  const set = new Set<string>();
  for (const t of input) {
    const v = t.trim();
    if (v) set.add(v);
  }
  return Array.from(set);
}

class Store {
  private data: AppData;
  private listeners = new Set<Listener>();
  private lastNotice: string | null = null;
  private lastError: string | null = null;

  constructor() {
    const result = loadData();
    this.data = result.data;
    this.lastNotice = result.notice ?? null;
    this.lastError = result.error ?? null;
  }

  getData(): AppData {
    return this.data;
  }

  consumeNotice(): string | null {
    const v = this.lastNotice;
    this.lastNotice = null;
    return v;
  }

  consumeError(): string | null {
    const v = this.lastError;
    this.lastError = null;
    return v;
  }

  setError(msg: string): void {
    this.lastError = msg;
    this.notify();
  }

  setNotice(msg: string): void {
    this.lastNotice = msg;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  private persist(): void {
    this.data.app.updatedAt = new Date().toISOString();
    const result = saveData(this.data);
    if (!result.ok) this.lastError = result.error ?? "保存失败";
    this.notify();
  }

  /* ---------------- People ---------------- */

  getPeople(): Person[] {
    return [...this.data.people].sort((a, b) => {
      const pa = a.pinned ? 1 : 0;
      const pb = b.pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }

  getPerson(id: string): Person | undefined {
    return this.data.people.find((p) => p.id === id);
  }

  addPerson(input: NewPersonInput): Person {
    const now = new Date().toISOString();
    const person: Person = {
      id: generateId("person"),
      name: input.name.trim(),
      type: input.type,
      description: input.description?.trim() || undefined,
      birthday: input.birthday?.trim() || undefined,
      mbti: input.mbti?.trim() || undefined,
      gender: input.gender?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.data.people.push(person);
    this.persist();
    return person;
  }

  updatePerson(id: string, input: UpdatePersonInput): void {
    const person = this.data.people.find((p) => p.id === id);
    if (!person) return;
    const now = new Date().toISOString();
    person.name = input.name.trim();
    person.type = input.type;
    person.description = input.description?.trim() || undefined;
    person.birthday = input.birthday?.trim() || undefined;
    person.mbti = input.mbti?.trim() || undefined;
    person.gender = input.gender?.trim() || undefined;
    person.updatedAt = now;
    for (const a of this.data.analyses) {
      if (a.subjectPersonId === id) a.subjectLabel = person.name;
    }
    this.persist();
  }

  togglePersonPin(id: string): void {
    const person = this.data.people.find((p) => p.id === id);
    if (!person) return;
    if (person.pinned) {
      delete person.pinned;
    } else {
      person.pinned = true;
    }
    this.persist();
  }

  deletePerson(id: string): void {
    this.data.people = this.data.people.filter((p) => p.id !== id);
    const now = new Date().toISOString();

    for (const m of this.data.materials) {
      if (m.personIds.includes(id)) {
        m.personIds = m.personIds.filter((pid) => pid !== id);
        m.updatedAt = now;
      }
    }

    for (const a of this.data.analyses) {
      if (a.subjectPersonId === id) {
        a.subjectPersonId = null;
        a.updatedAt = now;
      }
    }
    this.persist();
  }

  /* ---------------- Materials ---------------- */

  getMaterials(): Material[] {
    return [...this.data.materials].sort((a, b) => {
      const da = a.date || a.createdAt;
      const db = b.date || b.createdAt;
      return db.localeCompare(da);
    });
  }

  getMaterial(id: string): Material | undefined {
    return this.data.materials.find((m) => m.id === id);
  }

  getMaterialsForPerson(personId: string): Material[] {
    return this.getMaterials().filter((m) => m.personIds.includes(personId));
  }

  getPersonsForMaterial(materialId: string): Person[] {
    const material = this.getMaterial(materialId);
    if (!material) return [];
    const ids = new Set(material.personIds);
    return this.getPeople().filter((p) => ids.has(p.id));
  }

  getAllSources(): string[] {
    const set = new Set<string>();
    for (const m of this.data.materials) {
      if (m.source) set.add(m.source);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  getAllTags(): string[] {
    const set = new Set<string>();
    for (const m of this.data.materials) {
      for (const t of m.tags) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  searchMaterials(query: string, filters: MaterialFilters = {}): Material[] {
    const q = query.trim().toLowerCase();
    const list = this.getMaterials();
    return list.filter((m) => {
      if (filters.source && m.source !== filters.source) return false;
      if (filters.tag && !m.tags.includes(filters.tag)) return false;
      if (filters.dateFrom && m.date < filters.dateFrom) return false;
      if (filters.dateTo && m.date > filters.dateTo) return false;
      if (filters.personIds && filters.personIds.length > 0) {
        for (const pid of filters.personIds) {
          if (!m.personIds.includes(pid)) return false;
        }
      }
      if (q) {
        const haystack = [m.title, m.content, m.source, ...m.tags]
          .join("\n")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  addMaterial(input: NewMaterialInput): Material {
    const now = new Date().toISOString();
    const validPersonIds = (input.personIds ?? []).filter((pid) =>
      this.data.people.some((p) => p.id === pid)
    );
    const material: Material = {
      id: generateId("material"),
      date: input.date,
      source: input.source.trim(),
      title: input.title.trim(),
      content: input.content,
      tags: normalizeStringArray(input.tags),
      personIds: Array.from(new Set(validPersonIds)),
      sourceType: "manual",
      createdAt: now,
      updatedAt: now,
    };
    this.data.materials.push(material);

    for (const pid of material.personIds) {
      const person = this.data.people.find((p) => p.id === pid);
      if (person) person.updatedAt = now;
    }

    this.persist();
    return material;
  }

  updateMaterial(id: string, input: UpdateMaterialInput): void {
    const material = this.data.materials.find((m) => m.id === id);
    if (!material) return;
    const now = new Date().toISOString();

    const validPersonIds = (input.personIds ?? []).filter((pid) =>
      this.data.people.some((p) => p.id === pid)
    );

    material.date = input.date;
    material.source = input.source.trim();
    material.title = input.title.trim();
    material.content = input.content;
    material.tags = normalizeStringArray(input.tags);
    material.personIds = Array.from(new Set(validPersonIds));
    material.updatedAt = now;

    for (const pid of material.personIds) {
      const person = this.data.people.find((p) => p.id === pid);
      if (person) person.updatedAt = now;
    }

    this.persist();
  }

  deleteMaterial(id: string): void {
    this.data.materials = this.data.materials.filter((m) => m.id !== id);
    const now = new Date().toISOString();
    for (const a of this.data.analyses) {
      if (a.materialIds.includes(id)) {
        a.materialIds = a.materialIds.filter((mid) => mid !== id);
        a.updatedAt = now;
      }
    }
    this.persist();
  }

  /* ---------------- Analyses ---------------- */

  getAnalysis(id: string): Analysis | undefined {
    return this.data.analyses.find((a) => a.id === id);
  }

  getAnalysesForMaterial(materialId: string): Analysis[] {
    return this.data.analyses
      .filter((a) => a.materialIds.includes(materialId))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  getAnalysesForPerson(personId: string): Analysis[] {
    return this.data.analyses.filter((a) => a.subjectPersonId === personId);
  }

  getMaterialsForAnalysis(analysisId: string): Material[] {
    const a = this.getAnalysis(analysisId);
    if (!a) return [];
    return a.materialIds
      .map((mid) => this.getMaterial(mid))
      .filter((m): m is Material => !!m);
  }

  addAnalysis(input: NewAnalysisInput): Analysis {
    const person = this.data.people.find(
      (p) => p.id === input.subjectPersonId
    );
    if (!person) throw new Error("研究人物不存在，无法创建研究。");
    const now = new Date().toISOString();

    const validMaterialIds = input.materialIds.filter((mid) =>
      this.data.materials.some((m) => m.id === mid)
    );

    const analysis: Analysis = {
      id: generateId("analysis"),
      subjectPersonId: person.id,
      subjectLabel: person.name,
      title: input.title?.trim() || undefined,
      materialIds: validMaterialIds,
      excerpt: input.excerpt?.trim() || undefined,
      interpretation: input.interpretation?.trim() || undefined,
      traits: input.traits,
      evidence: input.evidence,
      createdAt: now,
      updatedAt: now,
    };
    this.data.analyses.push(analysis);

    for (const mid of validMaterialIds) {
      const material = this.data.materials.find((m) => m.id === mid);
      if (material) material.updatedAt = now;
    }
    person.updatedAt = now;

    this.persist();
    return analysis;
  }

  updateAnalysis(id: string, input: UpdateAnalysisInput): void {
    const analysis = this.data.analyses.find((a) => a.id === id);
    if (!analysis) return;
    const now = new Date().toISOString();

    if (input.subjectPersonId !== null) {
      const person = this.data.people.find(
        (p) => p.id === input.subjectPersonId
      );
      if (!person) throw new Error("研究人物不存在。");
      analysis.subjectPersonId = person.id;
      analysis.subjectLabel = person.name;
    } else {
      analysis.subjectPersonId = null;
    }

    analysis.title = input.title?.trim() || undefined;
    analysis.materialIds = input.materialIds.filter((mid) =>
      this.data.materials.some((m) => m.id === mid)
    );
    analysis.excerpt = input.excerpt?.trim() || undefined;
    analysis.interpretation = input.interpretation?.trim() || undefined;
    analysis.traits = input.traits;
    analysis.evidence = input.evidence;
    analysis.updatedAt = now;

    const person = analysis.subjectPersonId
      ? this.data.people.find((p) => p.id === analysis.subjectPersonId)
      : undefined;
    if (person) person.updatedAt = now;

    for (const mid of analysis.materialIds) {
      const m = this.data.materials.find((mm) => mm.id === mid);
      if (m) m.updatedAt = now;
    }

    this.persist();
  }

  addMaterialsToAnalysis(analysisId: string, materialIds: string[]): void {
    const analysis = this.data.analyses.find((a) => a.id === analysisId);
    if (!analysis) return;
    const now = new Date().toISOString();
    const set = new Set(analysis.materialIds);
    for (const mid of materialIds) {
      if (this.data.materials.some((m) => m.id === mid)) set.add(mid);
    }
    analysis.materialIds = Array.from(set);
    analysis.updatedAt = now;
    for (const mid of analysis.materialIds) {
      const m = this.data.materials.find((mm) => mm.id === mid);
      if (m) m.updatedAt = now;
    }
    this.persist();
  }

  removeMaterialFromAnalysis(analysisId: string, materialId: string): void {
    const analysis = this.data.analyses.find((a) => a.id === analysisId);
    if (!analysis) return;
    const now = new Date().toISOString();
    analysis.materialIds = analysis.materialIds.filter(
      (mid) => mid !== materialId
    );
    analysis.updatedAt = now;
    this.persist();
  }

  deleteAnalysis(id: string): void {
    this.data.analyses = this.data.analyses.filter((a) => a.id !== id);
    this.persist();
  }

  /* ---------------- Replace / Reset ---------------- */

  replaceAll(data: AppData): void {
    this.data = data;
    this.persist();
  }

  resetAll(): void {
    clearData();
    this.data = createEmptyAppData();
    this.persist();
  }
}

export const store = new Store();