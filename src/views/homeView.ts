import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import {
  PERSON_TYPE_LABELS,
  PERSON_TYPES,
  type PersonType,
} from "../types/enums";
import {
  exportAppData,
  downloadJSON,
  validateAppData,
} from "../core/importExport";
import { showModal } from "../components/modal";
import { renderLayout } from "../components/layout";
import { renderPersonCard } from "../components/personCard";

interface HomeState {
  query: string;
  typeFilter: PersonType | "";
}

const state: HomeState = {
  query: "",
  typeFilter: "",
};

export function renderHome(container: HTMLElement): void {
  clear(container);

  const content = el("div", { class: "view-home" });

  /* ------- 顶部操作 ------- */
  const actions = el("div", { class: "home-actions" });

  const newPersonBtn = el("button", { class: "btn btn-primary" }, ["新建人物"]);
  newPersonBtn.addEventListener("click", () => navigate("/new"));
  actions.appendChild(newPersonBtn);

  const materialsBtn = el("button", { class: "btn" }, ["材料库"]);
  materialsBtn.addEventListener("click", () => navigate("/materials"));
  actions.appendChild(materialsBtn);

  const exportBtn = el("button", { class: "btn" }, ["导出 JSON"]);
  exportBtn.addEventListener("click", () => {
    downloadJSON(
      `cognitive-model-${new Date().toISOString().slice(0, 10)}.json`,
      exportAppData(store.getData())
    );
  });
  actions.appendChild(exportBtn);

  const importBtn = el("button", { class: "btn" }, ["导入 JSON"]);
  const fileInput = el("input", {
    type: "file",
    accept: ".json,application/json",
    style: "display:none",
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = validateAppData(parsed);
      if (result.errors.length || !result.data) {
        store.setError("导入失败：\n" + result.errors.join("\n"));
        return;
      }
      const data = result.data;
      const notice = result.notice;
      showModal({
        title: "确认导入",
        message:
          "导入将替换当前所有数据，且不可撤销。是否继续？" +
          (notice ? `\n\n${notice}` : ""),
        confirmText: "替换并导入",
        danger: true,
        onConfirm: () => {
          store.replaceAll(data);
          store.setNotice("导入成功。" + (notice ? `（${notice}）` : ""));
        },
      });
    } catch (e) {
      store.setError("导入失败：" + (e as Error).message);
    } finally {
      fileInput.value = "";
    }
  });
  importBtn.addEventListener("click", () => fileInput.click());
  actions.appendChild(importBtn);
  actions.appendChild(fileInput);

  content.appendChild(actions);

  /* ------- 搜索 + 类型筛选 ------- */
  const listWrap = el("div", { class: "home-people-list-wrap" });
  const people = store.getPeople();

  if (people.length > 0) {
    const searchRow = el("div", { class: "home-search-row" });
    const searchInput = el("input", {
      type: "search",
      class: "search-input",
      placeholder: "搜索人物…",
    }) as HTMLInputElement;
    searchInput.value = state.query;
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      refresh();
    });
    searchRow.appendChild(searchInput);

    const typeSelect = el("select", {
      class: "filter-select",
    }) as HTMLSelectElement;
    typeSelect.appendChild(el("option", { value: "" }, ["全部类型"]));
    for (const t of PERSON_TYPES) {
      const opt = el("option", { value: t }, [PERSON_TYPE_LABELS[t]]);
      if (state.typeFilter === t) opt.selected = true;
      typeSelect.appendChild(opt);
    }
    typeSelect.addEventListener("change", () => {
      state.typeFilter = typeSelect.value as PersonType | "";
      refresh();
    });
    searchRow.appendChild(typeSelect);

    content.appendChild(searchRow);
  }

  content.appendChild(listWrap);

  function refresh(): void {
    clear(listWrap);
    const all = store.getPeople();
    const q = state.query.trim().toLowerCase();
    const filtered = all.filter((p) => {
      if (state.typeFilter && p.type !== state.typeFilter) return false;
      if (q) {
        const haystack = [p.name, p.description ?? ""]
          .join("\n")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (all.length === 0) {
      listWrap.appendChild(
        el("div", { class: "empty-state" }, [
          "还没有人物档案。点击「新建人物」开始记录。",
        ])
      );
      return;
    }

    if (filtered.length === 0) {
      listWrap.appendChild(
        el("div", { class: "empty-soft" }, ["没有匹配的人物。"])
      );
      return;
    }

    const ul = el("ul", { class: "person-list" });
    for (const person of filtered) ul.appendChild(renderPersonCard(person));
    listWrap.appendChild(ul);
  }

  refresh();

  container.appendChild(renderLayout({ title: "Cognitive Model", content }));
}