import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate } from "../utils/date";
import { PERSON_TYPE_LABELS } from "../types/enums";
import {
  computePersonModel,
  computePersonStats,
} from "../core/calculations";
import { renderLayout } from "../components/layout";
import { renderFunctionModel } from "../components/functionModel";
import {
  renderAnalysisCard,
  renderCompactAnalysisCard,
} from "../components/analysisCard";
import { showModal } from "../components/modal";
import type { Analysis, Trait, Material } from "../types/model";

const RESEARCH_PAGE_SIZE = 8;
const MATERIAL_PAGE_SIZE = 12;

const researchLimitStore = new Map<string, number>();
const materialSearchStore = new Map<string, string>();
const materialsSectionOpenStore = new Map<string, boolean>();

export function renderPersonDetail(
  container: HTMLElement,
  personId: string
): void {
  clear(container);
  const person = store.getPerson(personId);
  if (!person) {
    const nf = el("div", { class: "empty-state" }, ["未找到该人物档案。"]);
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

  let researchLimit =
    researchLimitStore.get(personId) ?? RESEARCH_PAGE_SIZE;

  const allAnalyses = store.getData().analyses;
  const allMaterials = store.getData().materials;
  const personAnalyses = store.getAnalysesForPerson(personId);
  const personMaterials = store.getMaterialsForPerson(personId);
  const stats = computePersonStats(personId, allMaterials, allAnalyses);
  const model = computePersonModel(personId, allAnalyses);

  const content = el("div", { class: "view-person-detail" });

  /* ------- 人物信息 ------- */
  const info = el("section", { class: "person-info" });
  const nameRow = el("div", { class: "person-name-row" });
  nameRow.appendChild(el("h2", { class: "person-name" }, [person.name]));
  nameRow.appendChild(
    el("span", { class: "person-subtitle" }, ["人物研究档案"])
  );
  info.appendChild(nameRow);

  const quickMetaParts: string[] = [PERSON_TYPE_LABELS[person.type]];
  if (person.mbti) quickMetaParts.push(person.mbti);
  if (person.gender) quickMetaParts.push(person.gender);
  if (person.birthday) quickMetaParts.push(person.birthday);
  info.appendChild(el("div", { class: "person-meta" }, quickMetaParts));

  const infoActions = el("div", { class: "info-actions" });

  const toMaterialsBtn = el("button", { class: "btn" }, ["材料库"]);
  toMaterialsBtn.addEventListener("click", () => navigate("/materials"));
  infoActions.appendChild(toMaterialsBtn);

  const editBtn = el("button", { class: "btn" }, ["编辑人物"]);
  editBtn.addEventListener("click", () =>
    navigate(`/person/${encodeURIComponent(personId)}/edit`)
  );
  infoActions.appendChild(editBtn);

  const newResearchBtn = el(
    "button",
    { class: "btn btn-primary" },
    ["🧠 开始一次研究"]
  );
  newResearchBtn.addEventListener("click", () =>
    navigate(`/person/${encodeURIComponent(personId)}/new-research`)
  );
  infoActions.appendChild(newResearchBtn);

  const deleteBtn = el(
    "button",
    { class: "btn-text-danger", type: "button" },
    ["删除人物"]
  );
  deleteBtn.addEventListener("click", () => {
    const rCount = personAnalyses.length;
    const mCount = personMaterials.length;
    const extraParts: string[] = [];
    if (mCount > 0) {
      extraParts.push(
        `${mCount} 份材料会保留，但会从该人物的相关人物中移除。`
      );
    }
    if (rCount > 0) {
      extraParts.push(
        `${rCount} 条研究会保留，但变成「原人物已删除」状态。`
      );
    }
    const extra = extraParts.length ? "\n" + extraParts.join(" ") : "";
    showModal({
      title: "删除人物",
      message: `将删除「${person.name}」。${extra}`,
      confirmText: "删除",
      danger: true,
      onConfirm: () => {
        store.deletePerson(personId);
        navigate("/");
      },
    });
  });
  infoActions.appendChild(deleteBtn);
  info.appendChild(infoActions);
  content.appendChild(info);

  /* ------- 基本资料 ------- */
  const hasBasicInfo =
    person.description ||
    person.birthday ||
    person.mbti ||
    person.gender;
  if (hasBasicInfo) {
    const basicSection = el("section", { class: "person-basic" });
    basicSection.appendChild(el("h3", {}, ["基本信息"]));
    const grid = el("div", { class: "basic-grid" });
    if (person.birthday) grid.appendChild(basicItem("生日", person.birthday));
    if (person.mbti) grid.appendChild(basicItem("MBTI", person.mbti));
    if (person.gender) grid.appendChild(basicItem("性别", person.gender));
    if (person.description)
      grid.appendChild(basicItem("描述", person.description));
    basicSection.appendChild(grid);
    basicSection.appendChild(
      el("p", { class: "basic-note" }, [
        "这些是已知 / 外部资料，不是 Cognitive Model 自动判断的结果。",
      ])
    );
    content.appendChild(basicSection);
  }

  /* ------- 统计 ------- */
  const statsSection = el("section", { class: "person-stats" });
  statsSection.appendChild(statItem("材料", String(stats.materialCount)));
  statsSection.appendChild(statItem("研究", String(stats.analysisCount)));
  statsSection.appendChild(statItem("人物判断", String(stats.traitCount)));
  statsSection.appendChild(statItem("八维证据", String(stats.evidenceCount)));
  content.appendChild(statsSection);

  /* ------- 相关材料（折叠） ------- */
  content.appendChild(
    renderPersonMaterialsSection(personId, personMaterials)
  );

  /* ------- 我的研究 ------- */
  const researchSection = el("section", { class: "person-research" });
  researchSection.appendChild(el("h3", {}, ["🧠 我的研究"]));

  const sortedResearch = [...personAnalyses].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (sortedResearch.length === 0) {
    researchSection.appendChild(
      el("p", { class: "empty" }, [
        "还没有开始研究。你已经积累的材料会在上方等着你。",
      ])
    );
  } else {
    const listWrap = el("div", { class: "research-list" });
    const shown = sortedResearch.slice(0, researchLimit);
    for (const a of shown) {
      listWrap.appendChild(renderCompactAnalysisCard(a));
    }
    researchSection.appendChild(listWrap);

    if (sortedResearch.length > researchLimit) {
      const moreBtn = el(
        "button",
        { class: "btn-link research-more", type: "button" },
        [`显示更多（还有 ${sortedResearch.length - researchLimit} 条）`]
      );
      moreBtn.addEventListener("click", () => {
        researchLimit += RESEARCH_PAGE_SIZE;
        researchLimitStore.set(personId, researchLimit);
        renderPersonDetail(container, personId);
      });
      researchSection.appendChild(moreBtn);
    }
  }

  const startResearchBtn = el(
    "button",
    { class: "btn btn-secondary research-start", type: "button" },
    ["＋ 开始一次研究"]
  );
  startResearchBtn.addEventListener("click", () =>
    navigate(`/person/${encodeURIComponent(personId)}/new-research`)
  );
  researchSection.appendChild(startResearchBtn);
  content.appendChild(researchSection);

  /* ------- 人物判断 ------- */
  content.appendChild(renderTraitSection(personAnalyses));

  /* ------- 理论视角：荣格八维 ------- */
  const theorySection = el("section", { class: "theory-section" });
  const details = el("details", { class: "theory-details" });
  details.appendChild(
    el("summary", { class: "theory-summary" }, [
      "理论视角：荣格八维",
      el("span", { class: "theory-hint" }, ["（可选解释框架）"]),
    ])
  );
  details.appendChild(
    el("p", { class: "model-note" }, [
      "以下模型根据针对该人物的研究实时计算，只反映当前证据的倾向，不代表这个人本身的固定类型。",
    ])
  );
  details.appendChild(renderFunctionModel(model, personId));
  theorySection.appendChild(details);
  content.appendChild(theorySection);

  container.appendChild(
    renderLayout({
      title: person.name,
      showBack: true,
      backTo: "/",
      content,
    })
  );
}

/* ---------------- 相关材料区块（折叠） ---------------- */

function renderPersonMaterialsSection(
  personId: string,
  materials: Material[]
): HTMLElement {
  const section = el("section", { class: "person-materials" });

  const details = el("details", {
    class: "person-materials-details",
  }) as HTMLDetailsElement;
  if (materialsSectionOpenStore.get(personId)) {
    details.open = true;
  }
  details.addEventListener("toggle", () => {
    materialsSectionOpenStore.set(personId, details.open);
  });

  const summary = el("summary", { class: "person-materials-summary" });
  summary.appendChild(
    el("span", { class: "person-materials-title" }, ["📁 相关材料"])
  );
  summary.appendChild(
    el("span", { class: "person-materials-count" }, [
      `（${materials.length} 份）`,
    ])
  );
  if (materials.length > 0) {
    summary.appendChild(
      el("span", { class: "person-materials-hint" }, ["点击展开"])
    );
  }
  details.appendChild(summary);

  if (materials.length === 0) {
    details.appendChild(
      el("p", { class: "empty" }, [
        "还没有与该人物相关的材料。去材料库新建材料时，可以勾选该人物。",
      ])
    );
    section.appendChild(details);
    return section;
  }

  const searchRow = el("div", { class: "library-search" });
  const searchInput = el("input", {
    type: "search",
    class: "search-input",
    placeholder: "在相关材料中搜索…",
  }) as HTMLInputElement;
  const savedQuery = materialSearchStore.get(personId) ?? "";
  searchInput.value = savedQuery;

  const listWrap = el("div", { class: "person-materials-list-wrap" });
  const moreWrap = el("div", { class: "person-materials-more" });

  let showCount = MATERIAL_PAGE_SIZE;

  function refresh(): void {
    const q = searchInput.value.trim().toLowerCase();
    materialSearchStore.set(personId, searchInput.value);

    const filtered = materials.filter((m) => {
      if (!q) return true;
      const haystack = [m.title, m.content, m.source, ...m.tags]
        .join("\n")
        .toLowerCase();
      return haystack.includes(q);
    });

    clear(listWrap);
    clear(moreWrap);

    if (filtered.length === 0) {
      listWrap.appendChild(
        el("p", { class: "empty" }, ["没有匹配的材料。"])
      );
      return;
    }

    const shown = filtered.slice(0, showCount);
    const ul = el("ul", { class: "material-list" });
    for (const m of shown) {
      ul.appendChild(renderPersonMaterialRow(m));
    }
    listWrap.appendChild(ul);

    if (filtered.length > shown.length) {
      const moreBtn = el(
        "button",
        { type: "button", class: "btn-link research-more" },
        [`显示更多（还有 ${filtered.length - shown.length} 份）`]
      );
      moreBtn.addEventListener("click", () => {
        showCount += MATERIAL_PAGE_SIZE;
        refresh();
      });
      moreWrap.appendChild(moreBtn);
    }
  }

  searchInput.addEventListener("input", () => {
    showCount = MATERIAL_PAGE_SIZE;
    refresh();
  });

  searchRow.appendChild(searchInput);
  details.appendChild(searchRow);
  details.appendChild(listWrap);
  details.appendChild(moreWrap);

  refresh();

  section.appendChild(details);
  return section;
}

function renderPersonMaterialRow(m: Material): HTMLElement {
  const li = el("li", { class: "material-card" });
  const btn = el("button", { class: "material-card-inner", type: "button" });
  btn.addEventListener("click", () =>
    navigate(`/materials/${encodeURIComponent(m.id)}`)
  );

  btn.appendChild(el("div", { class: "material-card-title" }, [m.title]));

  const meta = el("div", { class: "material-card-meta" });
  meta.appendChild(el("span", {}, [formatDate(m.date)]));
  if (m.source) meta.appendChild(el("span", {}, [m.source]));
  btn.appendChild(meta);

  if (m.tags.length > 0) {
    const tagsWrap = el("div", { class: "material-card-tags" });
    for (const t of m.tags) {
      tagsWrap.appendChild(el("span", { class: "tag-chip" }, [t]));
    }
    btn.appendChild(tagsWrap);
  }

  li.appendChild(btn);
  return li;
}

/* ---------------- 人物判断 ---------------- */

interface TraitEntry {
  analysis: Analysis;
  trait: Trait;
}

function renderTraitSection(analyses: Analysis[]): HTMLElement {
  const section = el("section", { class: "person-traits-section" });
  section.appendChild(el("h3", {}, ["👤 人物判断"]));

  const entries: TraitEntry[] = [];
  for (const a of analyses) {
    for (const t of a.traits) {
      entries.push({ analysis: a, trait: t });
    }
  }

  entries.sort(
    (x, y) =>
      new Date(y.analysis.updatedAt).getTime() -
      new Date(x.analysis.updatedAt).getTime()
  );

  if (entries.length === 0) {
    section.appendChild(
      el("p", { class: "empty" }, [
        "还没有形成人物判断。当你对多份材料形成相对稳定的判断时，可以记录下来。",
      ])
    );
    return section;
  }

  section.appendChild(
    el("p", { class: "model-note" }, [
      "来自你的研究，每一条都可以追溯到原始材料。",
    ])
  );

  const list = el("div", { class: "trait-entries" });
  for (const e of entries) list.appendChild(renderTraitEntry(e));
  section.appendChild(list);
  return section;
}

function renderTraitEntry(entry: TraitEntry): HTMLElement {
  const wrap = el("div", { class: "trait-entry" });

  wrap.appendChild(el("div", { class: "trait-entry-name" }, [entry.trait.name]));
  if (entry.trait.description) {
    wrap.appendChild(
      el("div", { class: "trait-entry-desc" }, [entry.trait.description])
    );
  }

  const sourceLabel = entry.analysis.title || "未命名研究";
  const matCount = entry.analysis.materialIds.length;
  wrap.appendChild(
    el("div", { class: "trait-entry-source" }, [
      `来自：${sourceLabel}`,
      " · ",
      matCount === 0 ? "无引用材料" : `引用 ${matCount} 份材料`,
    ])
  );

  const details = el("details", { class: "trait-entry-details" });
  details.appendChild(el("summary", {}, ["展开查看"]));
  details.appendChild(
    renderAnalysisCard(entry.analysis, { showSubject: false })
  );
  wrap.appendChild(details);

  return wrap;
}

/* ---------------- 通用 ---------------- */

function statItem(label: string, value: string): HTMLElement {
  const item = el("div", { class: "stat-item" });
  item.appendChild(el("div", { class: "stat-label" }, [label]));
  item.appendChild(el("div", { class: "stat-value" }, [value]));
  return item;
}

function basicItem(label: string, value: string): HTMLElement {
  const item = el("div", { class: "basic-item" });
  item.appendChild(el("div", { class: "basic-label" }, [label]));
  item.appendChild(el("div", { class: "basic-value" }, [value]));
  return item;
}