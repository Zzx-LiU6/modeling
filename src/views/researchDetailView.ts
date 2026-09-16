import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate, formatDateTime } from "../utils/date";
import { DIRECTION_LABELS, STRENGTH_LABELS } from "../types/enums";
import { renderLayout } from "../components/layout";
import { showModal } from "../components/modal";

export function renderResearchDetail(
  container: HTMLElement,
  analysisId: string
): void {
  clear(container);
  const analysis = store.getAnalysis(analysisId);
  if (!analysis) {
    const nf = el("div", { class: "empty-state" }, ["未找到该研究。"]);
    container.appendChild(
      renderLayout({
        title: "未找到",
        showBack: true,
        backTo: "/",
        content: nf,
      })
    );
    return;
  }

  const content = el("div", { class: "view-research-detail" });

  /* 头部 */
  const head = el("section", { class: "research-detail-head" });
  if (analysis.title) {
    head.appendChild(
      el("h2", { class: "research-detail-title" }, [analysis.title])
    );
  } else {
    head.appendChild(
      el("h2", {
        class: "research-detail-title research-detail-title-untitled",
      }, ["未命名研究"])
    );
  }

  const meta = el("div", { class: "research-detail-meta" });
  if (analysis.subjectPersonId) {
    const person = store.getPerson(analysis.subjectPersonId);
    const link = el(
      "button",
      { type: "button", class: "rn-subject-link" },
      [`研究谁 · ${person ? person.name : analysis.subjectLabel}`]
    );
    link.addEventListener("click", () =>
      navigate(`/person/${encodeURIComponent(analysis.subjectPersonId!)}`)
    );
    meta.appendChild(link);
  } else {
    meta.appendChild(
      el("span", { class: "rn-subject-missing" }, [
        `原人物：${analysis.subjectLabel}（已删除）`,
      ])
    );
  }
  meta.appendChild(
    el("span", {}, [`更新于 ${formatDateTime(analysis.updatedAt)}`])
  );
  head.appendChild(meta);

  const actions = el("div", { class: "research-detail-actions" });
  const editBtn = el("button", { class: "btn", type: "button" }, ["编辑研究"]);
  editBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysisId)}/edit`)
  );
  actions.appendChild(editBtn);

  const delBtn = el(
    "button",
    { class: "btn-text-danger", type: "button" },
    ["删除研究"]
  );
  delBtn.addEventListener("click", () => {
    showModal({
      title: "删除研究",
      message: "这条研究将被删除，引用的材料本身不受影响。",
      confirmText: "删除",
      danger: true,
      onConfirm: () => {
        store.deleteAnalysis(analysisId);
        if (analysis.subjectPersonId) {
          navigate(`/person/${encodeURIComponent(analysis.subjectPersonId)}`);
        } else {
          navigate("/");
        }
      },
    });
  });
  actions.appendChild(delBtn);
  head.appendChild(actions);
  content.appendChild(head);

  /* 相关材料 */
  const matSection = el("section", { class: "research-detail-section" });
  const matHead = el("div", { class: "section-head" });
  matHead.appendChild(el("h3", {}, ["相关材料"]));
  matHead.appendChild(
    el("span", { class: "section-count" }, [
      String(analysis.materialIds.length),
    ])
  );
  matSection.appendChild(matHead);

  if (analysis.materialIds.length === 0) {
    matSection.appendChild(el("p", { class: "empty" }, ["已无引用材料。"]));
  } else {
    const matList = el("ul", { class: "research-material-list" });
    for (const mid of analysis.materialIds) {
      const m = store.getMaterial(mid);
      if (!m) continue;
      const li = el("li", { class: "research-material-item" });
      const titleBtn = el(
        "button",
        { type: "button", class: "research-material-title" },
        [m.title]
      );
      titleBtn.addEventListener("click", () =>
        navigate(`/materials/${encodeURIComponent(m.id)}`)
      );
      li.appendChild(titleBtn);

      const metaRow = el("div", { class: "research-material-meta" });
      metaRow.appendChild(el("span", {}, [formatDate(m.date)]));
      if (m.source) metaRow.appendChild(el("span", {}, [m.source]));
      if (m.tags.length > 0) {
        for (const t of m.tags) {
          metaRow.appendChild(el("span", { class: "tag-chip" }, [t]));
        }
      }
      li.appendChild(metaRow);

      const removeBtn = el(
        "button",
        { type: "button", class: "research-material-remove", title: "移除" },
        ["移除"]
      );
      removeBtn.addEventListener("click", () => {
        store.removeMaterialFromAnalysis(analysisId, m.id);
      });
      li.appendChild(removeBtn);

      matList.appendChild(li);
    }
    matSection.appendChild(matList);
  }

  const addMatBtn = el(
    "button",
    { type: "button", class: "btn btn-secondary research-add-material" },
    ["＋ 添加相关材料"]
  );
  addMatBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysisId)}/add-materials`)
  );
  matSection.appendChild(addMatBtn);
  content.appendChild(matSection);

  /* 引用片段 */
  if (analysis.excerpt) {
    const sec = el("section", { class: "research-detail-section" });
    sec.appendChild(el("h3", {}, ["引用片段"]));
    sec.appendChild(
      el("blockquote", { class: "rn-excerpt" }, [analysis.excerpt])
    );
    content.appendChild(sec);
  }

  /* 我的观察 */
  if (analysis.interpretation) {
    const obsSection = el("section", { class: "research-detail-section" });
    obsSection.appendChild(el("h3", {}, ["我的观察"]));
    obsSection.appendChild(
      el("p", { class: "research-body" }, [analysis.interpretation])
    );
    content.appendChild(obsSection);
  }

  /* 人物判断 */
  if (analysis.traits.length > 0) {
    const traitSection = el("section", { class: "research-detail-section" });
    traitSection.appendChild(el("h3", {}, ["人物判断"]));
    const list = el("div", { class: "rn-traits" });
    for (const t of analysis.traits) {
      const traitEl = el("div", { class: "rn-trait" });
      traitEl.appendChild(el("div", { class: "rn-trait-name" }, [t.name]));
      if (t.description) {
        traitEl.appendChild(
          el("div", { class: "rn-trait-desc" }, [t.description])
        );
      }
      list.appendChild(traitEl);
    }
    traitSection.appendChild(list);
    content.appendChild(traitSection);
  }

  /* 理论解释 */
  if (analysis.evidence.length > 0) {
    const evSection = el("section", { class: "research-detail-section" });
    evSection.appendChild(el("h3", {}, ["理论解释（荣格八维）"]));
    const chips = el("div", { class: "rn-evidence" });
    for (const e of analysis.evidence) {
      chips.appendChild(
        el("span", { class: `fn-chip fn-chip-${e.direction}` }, [
          el("strong", {}, [e.function]),
          " · ",
          DIRECTION_LABELS[e.direction],
          " · ",
          String(e.strength),
          "（",
          STRENGTH_LABELS[e.strength],
          "）",
        ])
      );
    }
    evSection.appendChild(chips);
    content.appendChild(evSection);
  }

  /* 空状态提示：完全没有内容时，给一句柔和的引导 */
  const hasAnyContent =
    analysis.interpretation ||
    analysis.excerpt ||
    analysis.traits.length > 0 ||
    analysis.evidence.length > 0;
  if (!hasAnyContent) {
    content.appendChild(
      el("p", { class: "research-detail-hint" }, [
        "这是你先把材料放在一起的记录。之后可以随时点「编辑研究」补充想法、观察或判断。",
      ])
    );
  }

  /* 时间 */
  content.appendChild(
    el("p", { class: "research-detail-time" }, [
      `记录于 ${formatDateTime(analysis.createdAt)}`,
    ])
  );

  container.appendChild(
    renderLayout({
      title: "研究详情",
      showBack: true,
      backTo: analysis.subjectPersonId
        ? `/person/${encodeURIComponent(analysis.subjectPersonId)}`
        : "/",
      content,
    })
  );
}