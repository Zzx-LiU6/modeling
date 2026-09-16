import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { todayISO } from "../utils/date";
import { renderLayout } from "../components/layout";
import { showPersonQuickCreate } from "../components/modal";

export interface MaterialFormOptions {
  editMaterialId?: string;
}

export function renderMaterialForm(
  container: HTMLElement,
  options: MaterialFormOptions = {}
): void {
  clear(container);

  const editing = options.editMaterialId
    ? store.getMaterial(options.editMaterialId)
    : undefined;
  if (options.editMaterialId && !editing) {
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

  const content = el("div", { class: "view-material-form" });
  const form = el("form", { class: "form" });

  if (!editing) {
    form.appendChild(
      el("p", { class: "hint" }, [
        "保存原始材料。不需要立刻研究，也不必先写总结。",
      ])
    );
  }

  /* 日期 */
  const dateGroup = el("div", { class: "form-group" });
  dateGroup.appendChild(el("label", { for: "mat-date" }, ["日期 *"]));
  const dateInput = el("input", {
    id: "mat-date",
    type: "date",
    value: editing?.date ?? todayISO(),
  });
  dateGroup.appendChild(dateInput);
  form.appendChild(dateGroup);

  /* 来源 */
  const sourceGroup = el("div", { class: "form-group" });
  sourceGroup.appendChild(el("label", { for: "mat-source" }, ["来源 *"]));
  const sourceInput = el("input", {
    id: "mat-source",
    type: "text",
    maxlength: "80",
    placeholder: "例如：Bubble 对话 / 签售问答 / 采访",
  });
  sourceInput.value = editing?.source ?? "";
  sourceGroup.appendChild(sourceInput);

  const allSources = store.getAllSources();
  if (allSources.length > 0) {
    const sourceHints = el("div", { class: "source-hints" });
    sourceHints.appendChild(
      el("span", { class: "source-hints-label" }, ["之前用过："])
    );
    for (const s of allSources.slice(0, 12)) {
      const chip = el("button", { type: "button", class: "source-chip" }, [s]);
      chip.addEventListener("click", () => {
        sourceInput.value = s;
      });
      sourceHints.appendChild(chip);
    }
    sourceGroup.appendChild(sourceHints);
  }
  form.appendChild(sourceGroup);

  /* 标题 */
  const titleGroup = el("div", { class: "form-group" });
  titleGroup.appendChild(el("label", { for: "mat-title" }, ["标题 *"]));
  const titleInput = el("input", {
    id: "mat-title",
    type: "text",
    maxlength: "120",
    placeholder: "一句话识别这份材料",
  });
  titleInput.value = editing?.title ?? "";
  titleGroup.appendChild(titleInput);
  form.appendChild(titleGroup);

  /* 标签 */
  const tagGroup = el("div", { class: "form-group" });
  tagGroup.appendChild(el("label", { for: "mat-tags" }, ["标签"]));
  const tagInput = el("input", {
    id: "mat-tags",
    type: "text",
    placeholder: "用逗号分隔，例如：音乐, 吉他, 粉丝",
  });
  tagInput.value = (editing?.tags ?? []).join(", ");
  tagGroup.appendChild(tagInput);

  const allTags = store.getAllTags();
  if (allTags.length > 0) {
    const tagHints = el("div", { class: "source-hints" });
    tagHints.appendChild(
      el("span", { class: "source-hints-label" }, ["已有标签："])
    );
    for (const t of allTags.slice(0, 20)) {
      const chip = el("button", { type: "button", class: "source-chip" }, [t]);
      chip.addEventListener("click", () => {
        const current = tagInput.value
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (!current.includes(t)) current.push(t);
        tagInput.value = current.join(", ");
      });
      tagHints.appendChild(chip);
    }
    tagGroup.appendChild(tagHints);
  }
  form.appendChild(tagGroup);

  /* 相关人物 */
  const selectedPersonIds = new Set<string>(editing?.personIds ?? []);

  const personGroup = el("div", { class: "form-group" });
  personGroup.appendChild(el("label", {}, ["相关人物"]));
  personGroup.appendChild(
    el("p", { class: "hint" }, [
      "这份原始材料中涉及哪些人物？可以多选，也可以留空。",
    ])
  );

  const personChipsWrap = el("div", { class: "person-chips" });

  function renderPersonChips(): void {
    clear(personChipsWrap);
    const people = store.getPeople();

    if (people.length === 0) {
      personChipsWrap.appendChild(
        el("p", { class: "hint" }, [
          "还没有任何人物档案。可以点下方「＋ 新建人物」快速创建。",
        ])
      );
      return;
    }

    for (const p of people) {
      const selected = selectedPersonIds.has(p.id);
      const chip = el(
        "button",
        {
          type: "button",
          class: `person-chip ${selected ? "active" : ""}`,
        },
        [p.name]
      );
      chip.addEventListener("click", () => {
        if (selectedPersonIds.has(p.id)) selectedPersonIds.delete(p.id);
        else selectedPersonIds.add(p.id);
        renderPersonChips();
      });
      personChipsWrap.appendChild(chip);
    }
  }
  renderPersonChips();
  personGroup.appendChild(personChipsWrap);

  /* 内联快速新建人物 */
  const quickCreateBtn = el(
    "button",
    { type: "button", class: "btn-link person-chips-new" },
    ["＋ 新建人物"]
  );
  quickCreateBtn.addEventListener("click", () => {
    showPersonQuickCreate(({ name, type }) => {
      const person = store.addPerson({ name, type });
      selectedPersonIds.add(person.id);
      renderPersonChips();
    });
  });
  personGroup.appendChild(quickCreateBtn);

  form.appendChild(personGroup);

  /* 内容 */
  const contentGroup = el("div", { class: "form-group" });
  contentGroup.appendChild(
    el("label", { for: "mat-content" }, ["原始材料 *"])
  );
  const contentInput = el("textarea", {
    id: "mat-content",
    rows: "14",
    placeholder: "直接粘贴完整原文，不要求先总结。",
  });
  contentInput.value = editing?.content ?? "";
  contentGroup.appendChild(contentInput);
  form.appendChild(contentGroup);

  /* 错误 */
  const errorBox = el("div", {
    class: "form-error",
    style: "display:none",
  });
  form.appendChild(errorBox);

  /* 操作 */
  const buttons = el("div", { class: "form-actions" });
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, [
    editing ? "保存" : "保存材料",
  ]);
  const cancel = el("button", { type: "button", class: "btn" }, ["取消"]);
  cancel.addEventListener("click", () => {
    if (editing) navigate(`/materials/${encodeURIComponent(editing.id)}`);
    else navigate("/materials");
  });
  buttons.appendChild(submit);
  buttons.appendChild(cancel);
  form.appendChild(buttons);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    const title = titleInput.value.trim();
    const source = sourceInput.value.trim();
    const body = contentInput.value;
    if (!title) {
      errorBox.textContent = "请填写标题。";
      errorBox.style.display = "block";
      return;
    }
    if (!source) {
      errorBox.textContent = "请填写来源。";
      errorBox.style.display = "block";
      return;
    }
    if (!body.trim()) {
      errorBox.textContent = "请粘贴原始材料。";
      errorBox.style.display = "block";
      return;
    }

    const tags = tagInput.value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const input = {
      date: dateInput.value || todayISO(),
      source,
      title,
      content: body,
      tags,
      personIds: Array.from(selectedPersonIds),
    };

    if (editing) {
      store.updateMaterial(editing.id, input);
      navigate(`/materials/${encodeURIComponent(editing.id)}`);
    } else {
      const material = store.addMaterial(input);
      navigate(`/materials/${encodeURIComponent(material.id)}`);
    }
  });

  content.appendChild(form);
  container.appendChild(
    renderLayout({
      title: editing ? "编辑材料" : "新建材料",
      showBack: true,
      backTo: editing
        ? `/materials/${encodeURIComponent(editing.id)}`
        : "/materials",
      content,
    })
  );
}