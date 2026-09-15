import type { AppData } from "../types/model";

export const SCHEMA_VERSION = 7;

export function createEmptyAppData(): AppData {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    app: { createdAt: now, updatedAt: now },
    people: [],
    materials: [],
    analyses: [],
    modelSnapshots: [],
  };
}