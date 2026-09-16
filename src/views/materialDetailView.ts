import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate } from "../utils/date";
import { renderLayout } from "../components/layout";
import { renderAnalysisCard } from "../components/analysisCard";
import { showModal } from "../components/modal";

const SCROLL_RESTORE_KEY = "cognitive-model:restore-materials-scroll";

export function renderMaterialDetail(
  container: HTMLElement,
  materialId: string
): void {
  clear(container);
  const material = store.getMaterial(materialId);
  if (!material) {
    const nf = el("div", { class: "empty-state" }, ["未找到该材料。"]);
    container.appendChild(
      renderLayout({
        title: "未找到",
        showBack: true,
        backTo: "/materials",
        content: nf,
      })
    );
    return;
  }

  const analyses = store.getAnalysesForMaterial(materialId);
  const relatedPeople = store.getPersonsForMaterial(materialId);

  const content = el("div", { class: "view-material-detail" });

  /* ------- 页头 ------- */
  const head = el("section", { class: "material-head" });
  head.appendChild(el("h2", { class: "material-title" }, [material.title]));

  const meta = el("div", { class: "material-meta" });
  meta.appendChild(el("span", {}, [formatDate(material.date)]));
  meta.appendChild(el("span", {}, [material.source || "（无来源）"]));
  meta.appendChild(el("span", {}, [`被 ${analyses.length} 条研究引用`]));
  head.appendChild(meta);

  if (material.tags.length > 0) {
    const tagsWrap = el("div", { class: "material-head-tags" });
    for (const t of material.tags) {
      tagsWrap.appendChild(el("span", { class: "tag-chip" }, [t]));
    }
    head.appendChild(tagsWrap);
  }

  head.appendChild(
    el("p", { class: "material-head-note" }, [
      "同一份材料可以被多条研究引用，用于理解不同的人或不同的主题。",
    ])
  );

  const actions = el("div", { class: "material-actions" });
  const addBtn = el(
    "button",
    { class: "btn btn-primary btn-add-analysis", type: "button" },
    ["＋ 开始一次研究"]
  );
  addBtn.addEventListener("click", () =>
    navigate(`/materials/${encodeURIComponent(materialId)}/add-analysis`)
  );
  actions.appendChild(addBtn);

  const editBtn = el("button", { class: "btn", type: "button" }, [
    "编辑材料",
  ]);
  editBtn.addEventListener("click", () =>
    navigate(`/materials/${encodeURIComponent(materialId)}/edit`)
  );
  actions.appendChild(editBtn);

  const delBtn = el(
    "button",
    { class: "btn-text-danger", type: "button" },
    ["删除材料"]
  );
  delBtn.addEventListener("click", () => {
    const count = analyses.length;
    const extra =
      count > 0
        ? `\n将从 ${count} 条引用它的研究中移除这份材料。研究本身会保留。`
        : "";
    showModal({
      title: "删除材料",
      message: `将永久删除这份材料。${extra}`,
      confirmText: "删除",
      danger: true,
      onConfirm: () => {
        store.deleteMaterial(materialId);
        navigate("/materials");
      },
    });
  });
  actions.appendChild(delBtn);
  head.appendChild(actions);
  content.appendChild(head);

  /* ------- 相关人物 ------- */
  const personSection = el("section", { class: "material-persons" });
  const personHead = el("div", { class: "section-head" });
  personHead.appendChild(el("h3", {}, ["相关人物"]));
  personHead.appendChild(
    el("span", { class: "section-count" }, [String(relatedPeople.length)])
  );
  personSection.appendChild(personHead);

  if (relatedPeople.length === 0) {
    personSection.appendChild(
      el("p", { class: "empty" }, [
        "这份材料还没有关联任何人物。点「编辑材料」可以添加。",
      ])
    );
  } else {
    const chips = el("div", { class: "person-chip-list" });
    for (const p of relatedPeople) {
      const chip = el(
        "button",
        { type: "button", class: "person-chip active clickable" },
        [p.name]
      );
      chip.addEventListener("click", () =>
        navigate(`/person/${encodeURIComponent(p.id)}`)
      );
      chips.appendChild(chip);
    }
    personSection.appendChild(chips);
  }
  content.appendChild(personSection);

  /* ------- 原始材料 ------- */
  const panel = el("section", { class: "material-panel" });
  panel.appendChild(
    el("div", { class: "material-panel-label" }, ["原始材料"])
  );
  panel.appendChild(
    el("p", { class: "material-panel-note" }, [
      "保留原始材料，不等于已经形成结论。研究和人物判断会单独记录在下面。",
    ])
  );

  const contentWrap = el("div", {
    class: "material-content-wrap collapsed",
  });
  contentWrap.appendChild(
    el("pre", { class: "material-panel-content" }, [material.content])
  );
  panel.appendChild(contentWrap);

  content.appendChild(panel);

  /* 内容长时才显示"展开全文" */
  requestAnimationFrame(() => {
    if (contentWrap.scrollHeight > contentWrap.clientHeight + 4) {
      const expandBtn = el(
        "button",
        { class: "material-expand-btn", type: "button" },
        ["展开全文"]
      );
      expandBtn.addEventListener("click", () => {
        contentWrap.classList.remove("collapsed");
        expandBtn.remove();
      });
      panel.appendChild(expandBtn);
    } else {
      contentWrap.classList.remove("collapsed");
    }
  });

  /* ------- 引用这份材料的研究 ------- */
  const analysisSection = el("section", { class: "material-analyses" });
  const sectionHead = el("div", { class: "section-head" });
  sectionHead.appendChild(el("h3", {}, ["引用这份材料的研究"]));
  sectionHead.appendChild(
    el("span", { class: "section-count" }, [String(analyses.length)])
  );
  analysisSection.appendChild(sectionHead);

  if (analyses.length === 0) {
    analysisSection.appendChild(
      el("div", { class: "empty-soft" }, [
        "还没有研究引用这份材料。点「＋ 开始一次研究」开始。",
      ])
    );
  } else {
    for (const a of analyses) {
      analysisSection.appendChild(
        renderAnalysisCard(a, { showSubject: true })
      );
    }
  }
  content.appendChild(analysisSection);

  container.appendChild(
    renderLayout({
      title: "材料详情",
      showBack: true,
      backTo: "/materials",
      onBack: () => {
        sessionStorage.setItem(SCROLL_RESTORE_KEY, "1");
        navigate("/materials");
      },
      content,
    })
  );
}