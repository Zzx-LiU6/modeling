import type { Analysis } from "../types/model";
import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDateTime } from "../utils/date";
import { DIRECTION_LABELS } from "../types/enums";
import { renderLayout } from "../components/layout";

interface ResearchLibraryState {
  query: string;
  personId: string;
}

const state: ResearchLibraryState = {
  query: "",
  personId: "",
};

export function renderResearchLibrary(container: HTMLElement): void {
  clear(container);

  const content = el("div", { class: "view-research-library" });

  /* 搜索 */
  const searchRow = el("div", { class: "library-search" });
  const searchInput = el("input", {
    type: "search",
    class: "search-input",
    placeholder: "搜索标题、人物、观察、判断…",
  }) as HTMLInputElement;
  searchInput.value = state.query;
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    refresh();
  });
  searchRow.appendChild(searchInput);
  content.appendChild(searchRow);

  /* 人物筛选 */
  const people = store.getPeople();
  const filterRow = el("div", { class: "library-filters" });
  const personSelect = el("select", {
    class: "filter-select",
  }) as HTMLSelectElement;
  personSelect.appendChild(el("option", { value: "" }, ["全部人物"]));
  for (const p of people) {
    const opt = el("option", { value: p.id }, [p.name]);
    if (state.personId === p.id) opt.selected = true;
    personSelect.appendChild(opt);
  }
  personSelect.addEventListener("change", () => {
    state.personId = personSelect.value;
    refresh();
  });
  filterRow.appendChild(personSelect);

  if (state.personId || state.query) {
    const clearBtn = el("button", { class: "btn-link", type: "button" }, [
      "清空筛选",
    ]);
    clearBtn.addEventListener("click", () => {
      state.query = "";
      state.personId = "";
      searchInput.value = "";
      personSelect.value = "";
      refresh();
    });
    filterRow.appendChild(clearBtn);
  }
  content.appendChild(filterRow);

  /* 结果区 */
  const summaryWrap = el("div", { class: "rl-summary-wrap" });
  content.appendChild(summaryWrap);
  const listWrap = el("div", { class: "rl-list-wrap" });
  content.appendChild(listWrap);

  container.appendChild(
    renderLayout({
      title: "研究",
      showBack: true,
      backTo: "/",
      content,
    })
  );

  refresh();

  function refresh(): void {
    const all = store.getData().analyses;

    const q = state.query.trim().toLowerCase();
    const filtered = all.filter((a) => {
      if (state.personId && a.subjectPersonId !== state.personId) return false;
      if (!q) return true;
      const haystack = [
        a.title ?? "",
        a.subjectLabel,
        a.excerpt ?? "",
        a.interpretation ?? "",
        ...a.traits.map((t) => `${t.name} ${t.description ?? ""}`),
      ]
        .join("\n")
        .toLowerCase();
      return haystack.includes(q);
    });

    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    clear(summaryWrap);
    const summary = el("div", { class: "library-summary" });
    summary.appendChild(el("span", {}, [`共 ${filtered.length} 条研究`]));
    if (filtered.length !== all.length) {
      summary.appendChild(
        el("span", { class: "library-summary-note" }, [
          `（全部 ${all.length} 条）`,
        ])
      );
    }
    summaryWrap.appendChild(summary);

    clear(listWrap);
    if (filtered.length === 0) {
      listWrap.appendChild(
        el("div", { class: "empty-soft" }, [
          all.length === 0
            ? "还没有任何研究。可以从某个人的页面点「开始一次研究」开始。"
            : "没有匹配的研究。",
        ])
      );
      return;
    }

    const ul = el("ul", { class: "rl-list" });
    for (const a of filtered) {
      ul.appendChild(renderResearchCard(a));
    }
    listWrap.appendChild(ul);
  }
}

function renderResearchCard(a: Analysis): HTMLElement {
  const li = el("li", { class: "rl-card" });
  const btn = el("button", { class: "rl-card-inner", type: "button" });
  btn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(a.id)}`)
  );

  /* 标题 */
  if (a.title) {
    btn.appendChild(el("div", { class: "rl-card-title" }, [a.title]));
  } else {
    btn.appendChild(
      el("div", { class: "rl-card-title rl-card-title-untitled" }, [
        "未命名研究",
      ])
    );
  }

  /* meta：研究谁 + 材料数 */
  const metaParts: string[] = [];
  if (a.subjectPersonId) {
    metaParts.push(`研究谁 · ${a.subjectLabel}`);
  } else {
    metaParts.push(`原人物：${a.subjectLabel}（已删除）`);
  }
  const matCount = a.materialIds.length;
  metaParts.push(matCount === 0 ? "无引用材料" : `${matCount} 份材料`);
  btn.appendChild(el("div", { class: "rl-card-meta" }, metaParts));

  /* 观察 / 引用预览 */
  const text = a.interpretation || a.excerpt;
  if (text) {
    const truncated = text.length > 140 ? text.slice(0, 140) + "…" : text;
    btn.appendChild(el("p", { class: "rl-card-text" }, [truncated]));
  }

  /* chips */
  if (a.traits.length > 0 || a.evidence.length > 0) {
    const chips = el("div", { class: "rl-card-chips" });
    for (const t of a.traits) {
      chips.appendChild(
        el("span", { class: "fn-chip fn-chip-trait" }, [t.name])
      );
    }
    for (const e of a.evidence) {
      chips.appendChild(
        el("span", { class: `fn-chip fn-chip-${e.direction}` }, [
          el("strong", {}, [e.function]),
          " · ",
          DIRECTION_LABELS[e.direction],
          " · ",
          String(e.strength),
        ])
      );
    }
    btn.appendChild(chips);
  }

  /* 时间 */
  btn.appendChild(
    el("div", { class: "rl-card-footer" }, [
      `更新于 ${formatDateTime(a.updatedAt)}`,
    ])
  );

  li.appendChild(btn);
  return li;
}