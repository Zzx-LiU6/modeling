import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import {
  PERSON_TYPES,
  PERSON_TYPE_LABELS,
  type PersonType,
} from "../types/enums";
import { renderLayout } from "../components/layout";

export interface PersonFormOptions {
  editPersonId?: string;
}

export function renderPersonForm(
  container: HTMLElement,
  options: PersonFormOptions = {}
): void {
  clear(container);

  const editing = options.editPersonId
    ? store.getPerson(options.editPersonId)
    : undefined;
  if (options.editPersonId && !editing) {
    const nf = el("div", { class: "empty-state" }, ["未找到该人物。"]);
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

  const content = el("div", { class: "view-person-form" });
  const form = el("form", { class: "form" });

  const nameGroup = el("div", { class: "form-group" });
  nameGroup.appendChild(el("label", { for: "person-name" }, ["名称 *"]));
  const nameInput = el("input", {
    id: "person-name",
    type: "text",
    required: "required",
    maxlength: "50",
  });
  nameInput.value = editing?.name ?? "";
  nameGroup.appendChild(nameInput);
  form.appendChild(nameGroup);

  const typeGroup = el("div", { class: "form-group" });
  typeGroup.appendChild(el("label", { for: "person-type" }, ["类型 *"]));
  const typeSelect = el("select", { id: "person-type" });
  for (const t of PERSON_TYPES) {
    const opt = el("option", { value: t }, [PERSON_TYPE_LABELS[t]]);
    if (editing?.type === t) opt.selected = true;
    typeSelect.appendChild(opt);
  }
  typeGroup.appendChild(typeSelect);
  form.appendChild(typeGroup);

  const birthdayGroup = el("div", { class: "form-group" });
  birthdayGroup.appendChild(el("label", { for: "person-birthday" }, ["生日"]));
  const birthdayInput = el("input", { id: "person-birthday", type: "date" });
  birthdayInput.value = editing?.birthday ?? "";
  birthdayGroup.appendChild(birthdayInput);
  form.appendChild(birthdayGroup);

  const mbtiGroup = el("div", { class: "form-group" });
  mbtiGroup.appendChild(el("label", { for: "person-mbti" }, ["MBTI"]));
  const mbtiInput = el("input", {
    id: "person-mbti",
    type: "text",
    maxlength: "8",
    placeholder: "例如：INFJ（外部资料，不是本工具判断结果）",
  });
  mbtiInput.value = editing?.mbti ?? "";
  mbtiGroup.appendChild(mbtiInput);
  form.appendChild(mbtiGroup);

  const genderGroup = el("div", { class: "form-group" });
  genderGroup.appendChild(el("label", { for: "person-gender" }, ["性别"]));
  const genderSelect = el("select", {
    id: "person-gender",
  }) as HTMLSelectElement;
  const genderOptions: { value: string; label: string }[] = [
    { value: "", label: "不指定" },
    { value: "男", label: "男" },
    { value: "女", label: "女" },
    { value: "其他", label: "其他" },
  ];
  const currentGender = editing?.gender ?? "";
  for (const o of genderOptions) {
    const opt = el("option", { value: o.value }, [o.label]);
    if (currentGender === o.value) opt.selected = true;
    genderSelect.appendChild(opt);
  }
  genderGroup.appendChild(genderSelect);
  form.appendChild(genderGroup);

  const descGroup = el("div", { class: "form-group" });
  descGroup.appendChild(el("label", { for: "person-desc" }, ["简短描述"]));
  const descInput = el("textarea", {
    id: "person-desc",
    rows: "3",
    maxlength: "300",
  });
  descInput.value = editing?.description ?? "";
  descGroup.appendChild(descInput);
  form.appendChild(descGroup);

  const errorBox = el("div", {
    class: "form-error",
    style: "display:none",
  });
  form.appendChild(errorBox);

  const buttons = el("div", { class: "form-actions" });
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, [
    editing ? "保存" : "创建",
  ]);
  const cancel = el("button", { type: "button", class: "btn" }, ["取消"]);
  cancel.addEventListener("click", () => {
    if (editing) navigate(`/person/${encodeURIComponent(editing.id)}`);
    else navigate("/");
  });
  buttons.appendChild(submit);
  buttons.appendChild(cancel);
  form.appendChild(buttons);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      errorBox.textContent = "请输入名称。";
      errorBox.style.display = "block";
      return;
    }
    const input = {
      name,
      type: typeSelect.value as PersonType,
      description: descInput.value,
      birthday: birthdayInput.value,
      mbti: mbtiInput.value,
      gender: genderSelect.value,
    };
    if (editing) {
      store.updatePerson(editing.id, input);
      navigate(`/person/${encodeURIComponent(editing.id)}`);
    } else {
      const person = store.addPerson(input);
      navigate(`/person/${encodeURIComponent(person.id)}`);
    }
  });

  content.appendChild(form);
  container.appendChild(
    renderLayout({
      title: editing ? "编辑人物" : "新建人物",
      showBack: true,
      backTo: editing ? `/person/${encodeURIComponent(editing.id)}` : "/",
      content,
    })
  );
}