import type { Material, MaterialFilters } from "../types/model";
import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate } from "../utils/date";
import { renderLayout } from "../components/layout";

const PAGE_SIZE = 20;

const SCROLL_RESTORE_KEY = "cognitive-model:restore-materials-scroll";

interface LibraryState {
  query: string;
  filters: MaterialFilters;
  page: number;
  scrollY: number;
}

const state: LibraryState = {
  query: "",
  filters: {},
  page: 1,
  scrollY: 0,
};

export function renderMaterialLibrary(container: HTMLElement): void {
  clear(container);

  const content = el("div", { class: "view-material-library" });

  /* ------- 顶部操作 ------- */
  const topActions = el("div", { class: "library-top" });
  const newBtn = el("button", { class: "btn btn-primary" }, ["＋ 新建材料"]);
  newBtn.addEventListener("click", () => navigate("/materials/new"));
  topActions.appendChild(newBtn);
  content.appendChild(topActions);

  /* ------- 搜索 ------- */
  const searchRow = el("div", { class: "library-search" });
  const searchInput = el("input", {
    type: "search",
    placeholder: "搜索标题、内容、来源、标签…",
    class: "search-input",
  }) as HTMLInputElement;
  searchInput.value = state.query;
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    state.page = 1;
    state.scrollY = 0;
    refresh();
  });
  searchRow.appendChild(searchInput);
  content.appendChild(searchRow);

  /* ------- 筛选 ------- */
  const filterRow = el("div", { class: "library-filters" });

  const sources = store.getAllSources();
  const sourceSelect = buildSelect("来源", sources, state.filters.source);
  sourceSelect.addEventListener("change", () => {
    state.filters.source = sourceSelect.value || undefined;
    state.page = 1;
    state.scrollY = 0;
    refresh();
  });
  filterRow.appendChild(sourceSelect);

  const tags = store.getAllTags();
  const tagSelect = buildSelect("标签", tags, state.filters.tag);
  tagSelect.addEventListener("change", () => {
    state.filters.tag = tagSelect.value || undefined;
    state.page = 1;
    state.scrollY = 0;
    refresh();
  });
  filterRow.appendChild(tagSelect);

  const dateFrom = el("input", {
    type: "date",
    class: "filter-date",
  }) as HTMLInputElement;
  dateFrom.value = state.filters.dateFrom ?? "";
  dateFrom.addEventListener("change", () => {
    state.filters.dateFrom = dateFrom.value || undefined;
    state.page = 1;
    state.scrollY = 0;
    refresh();
  });
  filterRow.appendChild(dateFrom);

  const dateTo = el("input", {
    type: "date",
    class: "filter-date",
  }) as HTMLInputElement;
  dateTo.value = state.filters.dateTo ?? "";
  dateTo.addEventListener("change", () => {
    state.filters.dateTo = dateTo.value || undefined;
    state.page = 1;
    state.scrollY = 0;
    refresh();
  });
  filterRow.appendChild(dateTo);

  const clearBtn = el("button", { class: "btn-link", type: "button" }, [
    "清空筛选",
  ]);
  clearBtn.addEventListener("click", () => {
    state.query = "";
    state.filters = {};
    state.page = 1;
    state.scrollY = 0;
    searchInput.value = "";
    sourceSelect.value = "";
    tagSelect.value = "";
    dateFrom.value = "";
    dateTo.value = "";
    renderPersonFilter();
    refresh();
    window.scrollTo(0, 0);
  });
  filterRow.appendChild(clearBtn);

  content.appendChild(filterRow);

  /* ------- 人物筛选 ------- */
  const people = store.getPeople();
  const personFilterWrap = el("div", { class: "library-person-filter" });

  function renderPersonFilter(): void {
    clear(personFilterWrap);
    if (people.length === 0) return;

    personFilterWrap.appendChild(
      el("span", { class: "person-filter-label" }, ["人物筛选："])
    );

    const activeIds = state.filters.personIds ?? [];

    for (const p of people) {
      const active = activeIds.includes(p.id);
      const chip = el(
        "button",
        {
          type: "button",
          class: `person-chip ${active ? "active" : ""}`,
        },
        [p.name]
      );
      chip.addEventListener("click", () => {
        const current = state.filters.personIds ?? [];
        let next: string[];
        if (current.includes(p.id)) {
          next = current.filter((x) => x !== p.id);
        } else {
          next = [...current, p.id];
        }
        state.filters.personIds = next.length > 0 ? next : undefined;
        state.page = 1;
        state.scrollY = 0;
        renderPersonFilter();
        refresh();
      });
      personFilterWrap.appendChild(chip);
    }

    if (activeIds.length > 0) {
      const clearPerson = el(
        "button",
        { type: "button", class: "btn-link" },
        ["清除人物筛选"]
      );
      clearPerson.addEventListener("click", () => {
        state.filters.personIds = undefined;
        state.page = 1;
        state.scrollY = 0;
        renderPersonFilter();
        refresh();
      });
      personFilterWrap.appendChild(clearPerson);
    }
  }

  content.appendChild(personFilterWrap);
  renderPersonFilter();

  /* ------- 结果区 ------- */
  const listWrap = el("div", { class: "library-list-wrap" });
  content.appendChild(listWrap);

  container.appendChild(
    renderLayout({
      title: "材料库",
      showBack: true,
      backTo: "/",
      content,
    })
  );

  refresh();

  /* ------- 从材料详情返回时恢复滚动位置 ------- */
  const shouldRestore =
    sessionStorage.getItem(SCROLL_RESTORE_KEY) === "1";
  sessionStorage.removeItem(SCROLL_RESTORE_KEY);
  if (shouldRestore && state.scrollY > 0) {
    const target = state.scrollY;
    setTimeout(() => window.scrollTo(0, target), 0);
  }

  function refresh(): void {
    clear(listWrap);

    const results = store.searchMaterials(state.query, state.filters);
    const total = results.length;

    const summary = el("div", { class: "library-summary" });
    summary.appendChild(el("span", {}, [`共 ${total} 份材料`]));
    listWrap.appendChild(summary);

    if (total === 0) {
      listWrap.appendChild(
        el("div", { class: "empty-soft" }, [
          store.getMaterials().length === 0
            ? "还没有任何材料。点「＋ 新建材料」开始。"
            : "没有匹配的材料。试试清空筛选条件。",
        ])
      );
      return;
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = results.slice(start, start + PAGE_SIZE);

    const ul = el("ul", { class: "material-list" });
    for (const m of pageItems) ul.appendChild(renderMaterialRow(m));
    listWrap.appendChild(ul);

    if (totalPages > 1) {
      const pager = el("div", { class: "library-pager" });

      const prev = el(
        "button",
        { class: "pager-btn", type: "button" },
        ["‹"]
      );
      prev.disabled = state.page <= 1;
      prev.addEventListener("click", () => {
        if (state.page > 1) {
          state.page--;
          state.scrollY = 0;
          refresh();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      pager.appendChild(prev);

      for (let p = 1; p <= totalPages; p++) {
        if (
          totalPages > 7 &&
          p !== 1 &&
          p !== totalPages &&
          Math.abs(p - state.page) > 1
        ) {
          if (p === 2 || p === totalPages - 1) {
            pager.appendChild(el("span", { class: "pager-gap" }, ["…"]));
          }
          continue;
        }
        const btn = el(
          "button",
          {
            class: `pager-btn ${p === state.page ? "active" : ""}`,
            type: "button",
          },
          [String(p)]
        );
        btn.addEventListener("click", () => {
          state.page = p;
          state.scrollY = 0;
          refresh();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        pager.appendChild(btn);
      }

      const next = el(
        "button",
        { class: "pager-btn", type: "button" },
        ["›"]
      );
      next.disabled = state.page >= totalPages;
      next.addEventListener("click", () => {
        if (state.page < totalPages) {
          state.page++;
          state.scrollY = 0;
          refresh();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      pager.appendChild(next);

      listWrap.appendChild(pager);
    }
  }
}

function buildSelect(
  placeholder: string,
  values: string[],
  selected: string | undefined,
  labeler?: (v: string) => string
): HTMLSelectElement {
  const select = el("select", { class: "filter-select" }) as HTMLSelectElement;
  const noneOpt = el("option", { value: "" }, [placeholder]);
  if (!selected) noneOpt.selected = true;
  select.appendChild(noneOpt);
  for (const v of values) {
    const opt = el("option", { value: v }, [labeler ? labeler(v) : v]);
    if (selected === v) opt.selected = true;
    select.appendChild(opt);
  }
  return select;
}

function renderMaterialRow(material: Material): HTMLElement {
  const li = el("li", { class: "material-card" });
  const btn = el("button", { class: "material-card-inner", type: "button" });

  btn.addEventListener("click", () => {
    /* 记录当前滚动位置，返回时恢复 */
    state.scrollY = window.scrollY;
    navigate(`/materials/${encodeURIComponent(material.id)}`);
  });

  const titleRow = el("div", { class: "material-card-title-row" });
  titleRow.appendChild(
    el("div", { class: "material-card-title" }, [material.title])
  );
  btn.appendChild(titleRow);

  const meta = el("div", { class: "material-card-meta" });
  meta.appendChild(el("span", {}, [formatDate(material.date)]));
  if (material.source) meta.appendChild(el("span", {}, [material.source]));
  btn.appendChild(meta);

  if (material.personIds.length > 0) {
    const personsWrap = el("div", { class: "material-card-persons" });
    for (const pid of material.personIds) {
      const p = store.getPerson(pid);
      if (!p) continue;
      personsWrap.appendChild(
        el("span", { class: "person-chip-mini" }, [p.name])
      );
    }
    btn.appendChild(personsWrap);
  }

  if (material.tags.length > 0) {
    const tagsWrap = el("div", { class: "material-card-tags" });
    for (const t of material.tags) {
      tagsWrap.appendChild(el("span", { class: "tag-chip" }, [t]));
    }
    btn.appendChild(tagsWrap);
  }

  const count = store.getAnalysesForMaterial(material.id).length;
  if (count > 0) {
    btn.appendChild(
      el("div", { class: "material-card-footer" }, [
        `被 ${count} 条研究引用`,
      ])
    );
  }

  li.appendChild(btn);
  return li;
}