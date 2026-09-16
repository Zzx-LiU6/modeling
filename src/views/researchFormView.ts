import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate } from "../utils/date";
import {
  COGNITIVE_FUNCTIONS,
  FUNCTION_DESCRIPTIONS,
  DIRECTION_LABELS,
  STRENGTH_LABELS,
  type CognitiveFunction,
  type EvidenceDirection,
  type EvidenceStrength,
} from "../types/enums";
import type { Evidence, Trait } from "../types/model";
import { renderLayout } from "../components/layout";

export interface ResearchFormOptions {
  presetPersonId?: string;
  presetMaterialId?: string;
  editAnalysisId?: string;
}

export function renderResearchForm(
  container: HTMLElement,
  options: ResearchFormOptions = {}
): void {
  clear(container);

  const editing = options.editAnalysisId
    ? store.getAnalysis(options.editAnalysisId)
    : undefined;

  if (options.editAnalysisId && !editing) {
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

  const isEditing = !!editing;
  const people = store.getPeople();

  if (people.length === 0) {
    const nf = el("div", { class: "empty-state" }, [
      "还没有人物档案。请先在首页新建人物，再开始研究。",
    ]);
    container.appendChild(
      renderLayout({
        title: isEditing ? "编辑研究" : "开始一次研究",
        showBack: true,
        backTo: options.presetMaterialId
          ? `/materials/${encodeURIComponent(options.presetMaterialId)}`
          : "/",
        content: nf,
      })
    );
    return;
  }

  const presetMaterial = options.presetMaterialId
    ? store.getMaterial(options.presetMaterialId)
    : undefined;
  const presetPerson = options.presetPersonId
    ? store.getPerson(options.presetPersonId)
    : undefined;

  if (options.presetMaterialId && !presetMaterial) {
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

  const lockedSubjectId: string | null = isEditing
    ? editing!.subjectPersonId
    : presetPerson
    ? presetPerson.id
    : null;
  const editingIsNullSubject = isEditing && editing!.subjectPersonId === null;

  const selectedMaterialIds = new Set<string>();
  if (isEditing) {
    for (const mid of editing!.materialIds) selectedMaterialIds.add(mid);
  } else if (presetMaterial) {
    selectedMaterialIds.add(presetMaterial.id);
  }

  const evidenceList: Evidence[] = isEditing
    ? editing!.evidence.map((e) => ({ ...e }))
    : [];
  const traitList: Trait[] = isEditing
    ? editing!.traits.map((t) => ({ ...t }))
    : [];

  const content = el("div", { class: "view-research-form" });

  /* ---------------- 上下文 ---------------- */

  if (isEditing) {
    const ctx = el("section", { class: "analysis-context" });
    ctx.appendChild(el("div", { class: "context-label" }, ["正在编辑"]));
    if (editingIsNullSubject) {
      ctx.appendChild(
        el("h2", { class: "context-title" }, [
          `原人物：${editing!.subjectLabel}（已删除）`,
        ])
      );
      ctx.appendChild(
        el("p", { class: "context-note" }, [
          "该研究原本绑定的人物已被删除，研究仍然保留。",
        ])
      );
    } else {
      const p = store.getPerson(editing!.subjectPersonId!);
      ctx.appendChild(
        el("h2", { class: "context-title" }, [p ? p.name : "（未知）"])
      );
      ctx.appendChild(
        el("p", { class: "context-note" }, ["正在编辑这条研究。"])
      );
    }
    content.appendChild(ctx);
  } else if (presetPerson) {
    const ctx = el("section", { class: "analysis-context" });
    ctx.appendChild(el("div", { class: "context-label" }, ["开始一次研究"]));
    ctx.appendChild(el("h2", { class: "context-title" }, [presetPerson.name]));
    const mats = store.getMaterialsForPerson(presetPerson.id);
    const anas = store.getAnalysesForPerson(presetPerson.id);
    ctx.appendChild(
      el("div", { class: "context-meta" }, [
        `已有材料 ${mats.length} 份`,
        `已有研究 ${anas.length} 条`,
      ])
    );
    ctx.appendChild(
      el("p", { class: "context-note" }, [
        "选几份想放在一起看的材料，然后保存。之后可以随时回来补充想法。",
      ])
    );
    content.appendChild(ctx);
  } else if (presetMaterial) {
    const ctx = el("section", { class: "analysis-context" });
    ctx.appendChild(el("div", { class: "context-label" }, ["从这份材料开始"]));
    ctx.appendChild(
      el("h2", { class: "context-title" }, [presetMaterial.title])
    );
    ctx.appendChild(
      el("div", { class: "context-meta" }, [
        formatDate(presetMaterial.date),
        presetMaterial.source || "（无来源）",
      ])
    );
    const details = el("details", { class: "material-preview" });
    details.appendChild(el("summary", {}, ["查看原始材料"]));
    details.appendChild(
      el("pre", { class: "material-panel-content" }, [presetMaterial.content])
    );
    ctx.appendChild(details);
    content.appendChild(ctx);
  }

  /* ---------------- 表单 ---------------- */

  const form = el("form", { class: "form research-form" });

  let subjectSelect: HTMLSelectElement | null = null;
  let fixedSubjectId = "";

  if (editingIsNullSubject) {
    const step0 = el("div", { class: "step" });
    step0.appendChild(stepHead("1", "研究谁"));
    step0.appendChild(
      el("div", { class: "field-fixed" }, [
        `原人物：${editing!.subjectLabel}（已删除）`,
      ])
    );
    form.appendChild(step0);
  } else if (lockedSubjectId) {
    fixedSubjectId = lockedSubjectId;
  } else {
    const step0 = el("div", { class: "step" });
    step0.appendChild(stepHead("1", "研究谁"));
    step0.appendChild(
      el("p", { class: "step-hint" }, ["这条研究是关于谁的？"])
    );
    subjectSelect = el("select", { id: "res-subject" });
    for (const p of people) {
      subjectSelect.appendChild(el("option", { value: p.id }, [p.name]));
    }
    step0.appendChild(subjectSelect);
    form.appendChild(step0);
  }

  /* 现在在想什么？（可选） */
  const step1 = el("div", { class: "step" });
  step1.appendChild(stepHeadWithOptional("2", "现在在想什么？"));
  step1.appendChild(
    el("p", { class: "step-hint" }, [
      "可以写一个问题，也可以只是记下一个模糊的想法。不知道也没关系，可以先把材料放在一起。",
    ])
  );
  const titleInput = el("input", {
    type: "text",
    maxlength: "200",
    placeholder: "例如：他好像总是会注意到……",
  });
  titleInput.value = editing?.title ?? "";
  step1.appendChild(titleInput);
  form.appendChild(step1);

  /* 相关材料 */
  const step2 = el("div", { class: "step" });
  step2.appendChild(stepHead("3", "相关材料"));
  step2.appendChild(
    el("p", { class: "step-hint" }, [
      "搜索并选择相关材料。至少选一份。之后还可以继续添加。",
    ])
  );

  const pickerWrap = el("div", { class: "material-picker-wrap" });
  const pickerSearch = el("input", {
    type: "search",
    class: "search-input",
    placeholder: "搜索标题、内容、来源、标签…",
  }) as HTMLInputElement;
  pickerWrap.appendChild(pickerSearch);

  const pickerList = el("div", { class: "material-picker" });
  pickerWrap.appendChild(pickerList);
  step2.appendChild(pickerWrap);

  const pickerActions = el("div", { class: "picker-actions" });
  const toMaterialsBtn = el(
    "button",
    { type: "button", class: "btn-link" },
    ["去材料库新建材料 →"]
  );
  toMaterialsBtn.addEventListener("click", () => navigate("/materials/new"));
  pickerActions.appendChild(toMaterialsBtn);
  step2.appendChild(pickerActions);

  const selectedChipsWrap = el("div", { class: "selected-chips" });
  step2.appendChild(selectedChipsWrap);

  form.appendChild(step2);

  function renderSelectedChips(): void {
    clear(selectedChipsWrap);
    if (selectedMaterialIds.size === 0) return;
    selectedChipsWrap.appendChild(
      el("span", { class: "selected-chips-label" }, [
        `已选 ${selectedMaterialIds.size} 份：`,
      ])
    );
    for (const mid of selectedMaterialIds) {
      const m = store.getMaterial(mid);
      if (!m) continue;
      const chip = el("span", { class: "selected-chip" });
      chip.appendChild(el("span", {}, [m.title]));
      const x = el(
        "button",
        { type: "button", class: "selected-chip-remove", title: "移除" },
        ["×"]
      );
      x.addEventListener("click", () => {
        selectedMaterialIds.delete(mid);
        renderPicker();
        renderSelectedChips();
      });
      chip.appendChild(x);
      selectedChipsWrap.appendChild(chip);
    }
  }

  let pickerQuery = "";
  function renderPicker(): void {
    clear(pickerList);
    const results = store.searchMaterials(pickerQuery, {});
    if (results.length === 0) {
      pickerList.appendChild(
        el("p", { class: "rn-placeholder" }, [
          store.getMaterials().length === 0
            ? "还没有任何材料。可以先去材料库新建一份。"
            : "没有匹配的材料。",
        ])
      );
      return;
    }
    for (const m of results) {
      const row = el("label", { class: "material-picker-row" });
      const cb = el("input", {
        type: "checkbox",
        value: m.id,
      }) as HTMLInputElement;
      if (selectedMaterialIds.has(m.id)) cb.checked = true;
      cb.addEventListener("change", () => {
        if (cb.checked) selectedMaterialIds.add(m.id);
        else selectedMaterialIds.delete(m.id);
        renderSelectedChips();
      });
      row.appendChild(cb);
      const info = el("div", { class: "material-picker-info" });
      info.appendChild(
        el("div", { class: "material-picker-title" }, [m.title])
      );
      const metaParts = [formatDate(m.date)];
      if (m.source) metaParts.push(m.source);
      if (m.tags.length > 0)
        metaParts.push(m.tags.map((t) => `#${t}`).join(" "));
      info.appendChild(
        el("div", { class: "material-picker-meta" }, [metaParts.join(" · ")])
      );
      row.appendChild(info);
      pickerList.appendChild(row);
    }
  }

  pickerSearch.addEventListener("input", () => {
    pickerQuery = pickerSearch.value;
    renderPicker();
  });

  /* 我的观察 */
  const step3 = el("div", { class: "step" });
  step3.appendChild(stepHeadWithOptional("4", "我的观察"));
  step3.appendChild(
    el("p", { class: "step-hint" }, [
      "你如何理解这些材料？可以先写直觉、疑问或暂时的解释，不需要马上判断八维。",
    ])
  );
  const excerptInput = el("textarea", {
    rows: "2",
    maxlength: "1000",
    placeholder: "引用片段（可选）：直接粘贴材料中相关的一句或几句。",
  });
  excerptInput.value = editing?.excerpt ?? "";
  step3.appendChild(excerptInput);

  const interpInput = el("textarea", {
    rows: "6",
    maxlength: "4000",
    placeholder: "我的观察（可选）",
  });
  interpInput.value = editing?.interpretation ?? "";
  step3.appendChild(interpInput);
  form.appendChild(step3);

  /* 人物判断 */
  const step4 = el("div", { class: "step" });
  step4.appendChild(stepHeadWithOptional("5", "人物判断"));
  step4.appendChild(
    el("p", { class: "step-hint" }, [
      "如果已经形成相对稳定的判断，可以记录。也可以先留空，之后随时回来补充。",
    ])
  );
  const traitContainer = el("div", { class: "trait-rows" });
  step4.appendChild(traitContainer);

  const addTraitBtn = el(
    "button",
    { type: "button", class: "btn-add-evidence" },
    ["＋ 添加人物判断"]
  );
  step4.appendChild(addTraitBtn);
  form.appendChild(step4);

  /* 理论解释 */
  const step5 = el("div", { class: "step" });
  step5.appendChild(stepHeadWithOptional("6", "理论解释"));
  step5.appendChild(
    el("p", { class: "step-hint" }, [
      "如果希望用荣格八维解释，可以在这里关联。没有也可以直接保存。",
    ])
  );
  const evidenceContainer = el("div", { class: "evidence-rows" });
  step5.appendChild(evidenceContainer);

  const addEvidenceBtn = el(
    "button",
    { type: "button", class: "btn-add-evidence" },
    ["＋ 添加认知功能判断"]
  );
  step5.appendChild(addEvidenceBtn);
  form.appendChild(step5);

  /* 错误 */
  const errorBox = el("div", {
    class: "form-error",
    style: "display:none",
  });
  form.appendChild(errorBox);

  /* 保存 / 取消 */
  const buttons = el("div", { class: "form-actions" });
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, [
    isEditing ? "保存" : "保存研究",
  ]);
  const cancel = el("button", { type: "button", class: "btn" }, ["取消"]);
  cancel.addEventListener("click", () => {
    if (isEditing) {
      navigate(`/analysis/${encodeURIComponent(editing!.id)}`);
      return;
    }
    if (presetMaterial)
      navigate(`/materials/${encodeURIComponent(presetMaterial.id)}`);
    else if (presetPerson)
      navigate(`/person/${encodeURIComponent(presetPerson.id)}`);
    else navigate("/");
  });
  buttons.appendChild(submit);
  buttons.appendChild(cancel);
  form.appendChild(buttons);

  /* Trait 行 */
  function renderTraitRow(index: number): HTMLElement {
    const t = traitList[index];
    const row = el("div", { class: "trait-row" });

    const nameField = el("div", { class: "field field-trait-name" });
    nameField.appendChild(el("div", { class: "field-label" }, ["判断名称"]));
    const nameInput = el("input", {
      type: "text",
      maxlength: "80",
      placeholder: "例如：对外部反馈的关注方式",
    });
    nameInput.value = t.name;
    nameInput.addEventListener("input", () => {
      t.name = nameInput.value;
    });
    nameField.appendChild(nameInput);
    row.appendChild(nameField);

    const descField = el("div", { class: "field field-trait-desc" });
    descField.appendChild(el("div", { class: "field-label" }, ["描述"]));
    const descInput = el("input", {
      type: "text",
      maxlength: "500",
      placeholder: "可选",
    });
    descInput.value = t.description ?? "";
    descInput.addEventListener("input", () => {
      t.description = descInput.value.trim() || undefined;
    });
    descField.appendChild(descInput);
    row.appendChild(descField);

    const removeBtn = el(
      "button",
      { type: "button", class: "field-remove", title: "移除" },
      ["×"]
    );
    removeBtn.addEventListener("click", () => {
      traitList.splice(index, 1);
      rerenderTraits();
    });
    row.appendChild(removeBtn);

    return row;
  }

  function rerenderTraits(): void {
    clear(traitContainer);
    traitList.forEach((_, i) => {
      traitContainer.appendChild(renderTraitRow(i));
    });
  }

  addTraitBtn.addEventListener("click", () => {
    traitList.push({ name: "" });
    rerenderTraits();
  });

  /* Evidence 行 */
  function renderEvidenceRow(index: number): HTMLElement {
    const ev = evidenceList[index];
    const row = el("div", { class: "evidence-row" });

    const fnField = el("div", { class: "field field-fn" });
    fnField.appendChild(el("div", { class: "field-label" }, ["功能"]));
    const fnSelect = el("select", {});
    const used = new Set(
      evidenceList.filter((_, i) => i !== index).map((e) => e.function)
    );
    for (const fn of COGNITIVE_FUNCTIONS) {
      if (used.has(fn)) continue;
      const opt = el("option", { value: fn }, [
        `${fn} · ${FUNCTION_DESCRIPTIONS[fn]}`,
      ]);
      if (fn === ev.function) opt.selected = true;
      fnSelect.appendChild(opt);
    }
    fnSelect.addEventListener("change", () => {
      ev.function = fnSelect.value as CognitiveFunction;
    });
    fnField.appendChild(fnSelect);
    row.appendChild(fnField);

    const dirField = el("div", { class: "field field-dir" });
    dirField.appendChild(el("div", { class: "field-label" }, ["方向"]));
    const dirSelect = el("select", {});
    for (const d of ["support", "against"] as EvidenceDirection[]) {
      const opt = el("option", { value: d }, [DIRECTION_LABELS[d]]);
      if (d === ev.direction) opt.selected = true;
      dirSelect.appendChild(opt);
    }
    dirSelect.addEventListener("change", () => {
      ev.direction = dirSelect.value as EvidenceDirection;
    });
    dirField.appendChild(dirSelect);
    row.appendChild(dirField);

    const strField = el("div", { class: "field field-str" });
    strField.appendChild(el("div", { class: "field-label" }, ["强度"]));
    const strSelect = el("select", {});
    for (const s of [1, 2, 3, 4, 5] as EvidenceStrength[]) {
      const opt = el("option", { value: String(s) }, [
        `${s} · ${STRENGTH_LABELS[s]}`,
      ]);
      if (s === ev.strength) opt.selected = true;
      strSelect.appendChild(opt);
    }
    strSelect.addEventListener("change", () => {
      ev.strength = Number(strSelect.value) as EvidenceStrength;
    });
    strField.appendChild(strSelect);
    row.appendChild(strField);

    const reasonField = el("div", { class: "field field-reason" });
    reasonField.appendChild(el("div", { class: "field-label" }, ["判断理由"]));
    const reasonInput = el("input", {
      type: "text",
      placeholder: "可选",
      maxlength: "500",
    });
    reasonInput.value = ev.reasoning ?? "";
    reasonInput.addEventListener("input", () => {
      ev.reasoning = reasonInput.value.trim() || undefined;
    });
    reasonField.appendChild(reasonInput);
    row.appendChild(reasonField);

    const removeBtn = el(
      "button",
      { type: "button", class: "field-remove", title: "移除" },
      ["×"]
    );
    removeBtn.addEventListener("click", () => {
      evidenceList.splice(index, 1);
      rerenderEvidence();
    });
    row.appendChild(removeBtn);

    return row;
  }

  function rerenderEvidence(): void {
    clear(evidenceContainer);
    evidenceList.forEach((_, i) => {
      evidenceContainer.appendChild(renderEvidenceRow(i));
    });
  }

  addEvidenceBtn.addEventListener("click", () => {
    const used = new Set(evidenceList.map((e) => e.function));
    const available = COGNITIVE_FUNCTIONS.filter((f) => !used.has(f));
    if (available.length === 0) return;
    evidenceList.push({
      function: available[0],
      direction: "support",
      strength: 3,
    });
    rerenderEvidence();
  });

  renderPicker();
  renderSelectedChips();
  rerenderTraits();
  rerenderEvidence();

  /* 提交 */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    let subjectPersonId: string | null = null;
    if (editingIsNullSubject) {
      subjectPersonId = null;
    } else {
      subjectPersonId = fixedSubjectId || subjectSelect?.value || "";
      if (!subjectPersonId) {
        errorBox.textContent = "请选择研究谁。";
        errorBox.style.display = "block";
        return;
      }
    }

    if (selectedMaterialIds.size === 0) {
      errorBox.textContent = "请至少选择一份相关材料。";
      errorBox.style.display = "block";
      return;
    }

    for (const t of traitList) {
      if (!t.name.trim()) {
        errorBox.textContent = "每一条人物判断都需要填写名称。";
        errorBox.style.display = "block";
        return;
      }
    }

    const seen = new Set<CognitiveFunction>();
    for (const ev of evidenceList) {
      if (seen.has(ev.function)) {
        errorBox.textContent = `功能 ${ev.function} 重复出现，请修正。`;
        errorBox.style.display = "block";
        return;
      }
      seen.add(ev.function);
    }

    const title = titleInput.value.trim() || undefined;
    const excerpt = excerptInput.value.trim() || undefined;
    const interpretation = interpInput.value.trim() || undefined;
    const traits = traitList.map((t) => ({
      name: t.name.trim(),
      description: t.description?.trim() || undefined,
    }));
    const materialIds = Array.from(selectedMaterialIds);

    try {
      if (isEditing) {
        store.updateAnalysis(editing!.id, {
          subjectPersonId,
          title,
          materialIds,
          excerpt,
          interpretation,
          traits,
          evidence: evidenceList,
        });
        navigate(`/analysis/${encodeURIComponent(editing!.id)}`);
      } else {
        if (subjectPersonId === null) {
          throw new Error("创建研究需要选择研究谁。");
        }
        const created = store.addAnalysis({
          subjectPersonId,
          title,
          materialIds,
          excerpt,
          interpretation,
          traits,
          evidence: evidenceList,
        });
        navigate(`/analysis/${encodeURIComponent(created.id)}`);
      }
    } catch (err) {
      errorBox.textContent = (err as Error).message;
      errorBox.style.display = "block";
    }
  });

  content.appendChild(form);

  const backTo = presetMaterial
    ? `/materials/${encodeURIComponent(presetMaterial.id)}`
    : presetPerson
    ? `/person/${encodeURIComponent(presetPerson.id)}`
    : isEditing
    ? `/analysis/${encodeURIComponent(editing!.id)}`
    : "/";

  container.appendChild(
    renderLayout({
      title: isEditing ? "编辑研究" : "开始一次研究",
      showBack: true,
      backTo,
      content,
    })
  );
}

function stepHead(num: string, title: string): HTMLElement {
  const wrap = el("div", { class: "step-head" });
  wrap.appendChild(el("span", { class: "step-num" }, [num]));
  wrap.appendChild(el("h3", { class: "step-title" }, [title]));
  return wrap;
}

function stepHeadWithOptional(num: string, title: string): HTMLElement {
  const wrap = el("div", { class: "step-head" });
  wrap.appendChild(el("span", { class: "step-num" }, [num]));
  wrap.appendChild(el("h3", { class: "step-title" }, [title]));
  wrap.appendChild(el("span", { class: "step-optional" }, ["可选"]));
  return wrap;
}