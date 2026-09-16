import type { AppData } from "../types/model";
import { createEmptyAppData, SCHEMA_VERSION } from "./schema";
import { migrateToCurrent, MigrationError } from "./migrations";

const STORAGE_KEY = "cognitive-model:data";

export interface LoadResult {
  data: AppData;
  notice?: string;
  error?: string;
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export function loadData(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return {
      data: createEmptyAppData(),
      error: "读取本地数据失败：" + (e as Error).message,
    };
  }
  if (!raw) return { data: createEmptyAppData() };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      data: createEmptyAppData(),
      error: "本地数据不是有效 JSON，已使用空白数据。",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      data: createEmptyAppData(),
      error: "本地数据格式异常，已使用空白数据。",
    };
  }
  const version = (parsed as { schemaVersion?: unknown }).schemaVersion;

  if (version !== SCHEMA_VERSION) {
    try {
      const migrated = migrateToCurrent(parsed);
      const saveResult = saveData(migrated);
      return {
        data: migrated,
        notice: saveResult.ok
          ? `已从旧版 schemaVersion ${String(version)} 迁移到 v${SCHEMA_VERSION}。`
          : "数据已迁移，但写回本地失败，请尽快导出备份。",
      };
    } catch (e) {
      const msg =
        e instanceof MigrationError
          ? e.message
          : "旧版数据迁移失败：" + (e as Error).message;
      return { data: createEmptyAppData(), error: msg };
    }
  }

  /* 版本相同也跑一次规范化，处理字段级兼容。 */
  try {
    const normalized = migrateToCurrent(parsed);
    const saveResult = saveData(normalized);
    if (!saveResult.ok) {
      return {
        data: normalized,
        error: "数据规范化成功，但写回本地失败，请尽快导出备份。",
      };
    }
    return { data: normalized };
  } catch (e) {
    const msg =
      e instanceof MigrationError
        ? e.message
        : "数据规范化失败：" + (e as Error).message;
    return { data: createEmptyAppData(), error: msg };
  }
}

export function saveData(data: AppData): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: "保存本地数据失败：" + (e as Error).message,
    };
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}