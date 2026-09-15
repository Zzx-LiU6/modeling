import type { Analysis } from "../types/model";
import { DIRECTION_LABELS } from "../types/enums";
import { el } from "../utils/dom";
import { formatDate, formatDateTime } from "../utils/date";
import { store } from "../store";
import { showModal } from "./modal";
import { navigate } from "../router";

export interface AnalysisCardOptions {
  showSubject?: boolean;
}

export function renderAnalysisCard(
  analysis: Analysis,
  options: AnalysisCardOptions = {}
): HTMLElement {
  const card = el("article", { class: "research-note" });

  const head = el("div", { class: "rn-head" });

  if (options.showSubject !== false) {
    if (analysis.subjectPersonId) {
      const link = el(
        "button",
        { type: "button", class: "rn-subject rn-subject-link" },
        [`研究谁 · ${analysis.subjectLabel}`]
      );
      link.addEventListener("click", () =>
        navigate(`/person/${encodeURIComponent(analysis.subjectPersonId!)}`)
      );
      head.appendChild(link);
    } else {
      head.appendChild(
        el("span", { class: "rn-subject rn-subject-missing" }, [
          `原人物：${analysis.subjectLabel}（已删除）`,
        ])
      );
    }
  } else {
    head.appendChild(el("span", { class: "rn-subject" }, ["研究笔记"]));
  }

  const headActions = el("div", { class: "rn-head-actions" });

  const viewBtn = el(
    "button",
    { type: "button", class: "rn-edit", title: "查看研究" },
    ["查看"]
  );
  viewBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysis.id)}`)
  );
  headActions.appendChild(viewBtn);

  const editBtn = el(
    "button",
    { type: "button", class: "rn-edit", title: "编辑研究" },
    ["编辑"]
  );
  editBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysis.id)}/edit`)
  );
  headActions.appendChild(editBtn);

  const delBtn = el(
    "button",
    { type: "button", class: "rn-delete", title: "删除研究" },
    ["删除"]
  );
  delBtn.addEventListener("click", () => {
    showModal({
      title: "删除研究",
      message: "这条研究将被删除，引用的材料本身不受影响。",
      confirmText: "删除",
      danger: true,
      onConfirm: () => store.deleteAnalysis(analysis.id),
    });
  });
  headActions.appendChild(delBtn);

  head.appendChild(headActions);
  card.appendChild(head);

  if (analysis.title) {
    const titleEl = el("h4", { class: "rn-title rn-title-link" }, [
      analysis.title,
    ]);
    titleEl.addEventListener("click", () =>
      navigate(`/analysis/${encodeURIComponent(analysis.id)}`)
    );
    card.appendChild(titleEl);
  }

  card.appendChild(el("div", { class: "rn-label" }, ["相关材料"]));
  if (analysis.materialIds.length === 0) {
    card.appendChild(
      el("p", { class: "rn-placeholder" }, ["已无引用材料"])
    );
  } else {
    const matList = el("ul", { class: "rn-materials" });
    for (const mid of analysis.materialIds) {
      const m = store.getMaterial(mid);
      if (!m) continue;
      const li = el("li", {});
      const btn = el(
        "button",
        { type: "button", class: "rn-material-link" },
        [m.title]
      );
      btn.addEventListener("click", () =>
        navigate(`/materials/${encodeURIComponent(m.id)}`)
      );
      li.appendChild(btn);
      li.appendChild(
        el("span", { class: "rn-material-date" }, [formatDate(m.date)])
      );
      matList.appendChild(li);
    }
    card.appendChild(matList);
  }

  if (analysis.excerpt) {
    card.appendChild(el("div", { class: "rn-label" }, ["引用片段"]));
    card.appendChild(
      el("blockquote", { class: "rn-excerpt" }, [analysis.excerpt])
    );
  }

  if (analysis.interpretation) {
    card.appendChild(el("div", { class: "rn-label" }, ["我的观察"]));
    card.appendChild(
      el("p", { class: "rn-body" }, [analysis.interpretation])
    );
  }

  if (analysis.traits.length > 0) {
    card.appendChild(el("div", { class: "rn-label" }, ["人物判断"]));
    const traitList = el("div", { class: "rn-traits" });
    for (const t of analysis.traits) {
      const traitEl = el("div", { class: "rn-trait" });
      traitEl.appendChild(el("div", { class: "rn-trait-name" }, [t.name]));
      if (t.description) {
        traitEl.appendChild(
          el("div", { class: "rn-trait-desc" }, [t.description])
        );
      }
      traitList.appendChild(traitEl);
    }
    card.appendChild(traitList);
  }

  if (analysis.evidence.length > 0) {
    card.appendChild(
      el("div", { class: "rn-label" }, ["理论解释（荣格八维）"])
    );
    const chips = el("div", { class: "rn-evidence" });
    for (const e of analysis.evidence) {
      chips.appendChild(renderEvidenceChip(e.function, e.direction, e.strength));
    }
    card.appendChild(chips);
  }

  card.appendChild(
    el("div", { class: "rn-time" }, [
      `记录于 ${formatDateTime(analysis.createdAt)}`,
    ])
  );

  return card;
}

export function renderCompactAnalysisCard(analysis: Analysis): HTMLElement {
  const card = el("article", { class: "research-item" });

  const titleRow = el("div", { class: "research-item-head" });

  if (analysis.title) {
    const titleBtn = el(
      "button",
      { type: "button", class: "research-item-title" },
      [analysis.title]
    );
    titleBtn.addEventListener("click", () =>
      navigate(`/analysis/${encodeURIComponent(analysis.id)}`)
    );
    titleRow.appendChild(titleBtn);
  } else {
    const untitled = el(
      "button",
      {
        type: "button",
        class: "research-item-title research-item-title-untitled",
      },
      ["未命名研究"]
    );
    untitled.addEventListener("click", () =>
      navigate(`/analysis/${encodeURIComponent(analysis.id)}`)
    );
    titleRow.appendChild(untitled);
  }

  const editBtn = el(
    "button",
    { type: "button", class: "research-item-edit", title: "编辑研究" },
    ["编辑"]
  );
  editBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysis.id)}/edit`)
  );
  titleRow.appendChild(editBtn);

  card.appendChild(titleRow);

  const matCount = analysis.materialIds.length;
  const meta = el("div", { class: "research-item-meta" });
  meta.appendChild(
    el("span", {}, [matCount === 0 ? "无引用材料" : `${matCount} 份材料`])
  );
  meta.appendChild(
    el("span", {}, [`更新于 ${formatDateTime(analysis.updatedAt)}`])
  );
  card.appendChild(meta);

  const text = analysis.interpretation || analysis.excerpt;
  if (text) {
    const truncated = text.length > 120 ? text.slice(0, 120) + "…" : text;
    card.appendChild(el("p", { class: "research-item-text" }, [truncated]));
  }

  if (analysis.traits.length > 0) {
    const chips = el("div", { class: "recent-chips" });
    for (const t of analysis.traits) {
      chips.appendChild(
        el("span", { class: "fn-chip fn-chip-trait" }, [t.name])
      );
    }
    card.appendChild(chips);
  }

  if (analysis.evidence.length > 0) {
    const chips = el("div", { class: "recent-chips" });
    for (const e of analysis.evidence) {
      chips.appendChild(renderEvidenceChip(e.function, e.direction, e.strength));
    }
    card.appendChild(chips);
  }

  return card;
}

function renderEvidenceChip(
  fn: string,
  direction: "support" | "against",
  strength: number
): HTMLElement {
  return el("span", { class: `fn-chip fn-chip-${direction}` }, [
    el("strong", {}, [fn]),
    " · ",
    DIRECTION_LABELS[direction],
    " · ",
    String(strength),
  ]);
}