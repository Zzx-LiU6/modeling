import { el } from "../utils/dom";
import {
  PERSON_TYPES,
  PERSON_TYPE_LABELS,
  type PersonType,
} from "../types/enums";

export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function showModal(options: ModalOptions): void {
  const backdrop = el("div", { class: "modal-backdrop" });
  const modal = el("div", { class: "modal" });

  modal.appendChild(el("h3", { class: "modal-title" }, [options.title]));
  modal.appendChild(el("p", { class: "modal-message" }, [options.message]));

  const actions = el("div", { class: "modal-actions" });

  const cancelBtn = el("button", { class: "btn", type: "button" }, [
    options.cancelText ?? "取消",
  ]);
  cancelBtn.addEventListener("click", () => {
    cleanup();
    options.onCancel?.();
  });
  actions.appendChild(cancelBtn);

  const confirmBtn = el(
    "button",
    {
      class: `btn ${options.danger ? "btn-danger" : "btn-primary"}`,
      type: "button",
    },
    [options.confirmText ?? "确认"]
  );
  confirmBtn.addEventListener("click", () => {
    cleanup();
    options.onConfirm();
  });
  actions.appendChild(confirmBtn);
  modal.appendChild(actions);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function cleanup() {
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      cleanup();
      options.onCancel?.();
    }
  });
}

/* ---------------- 内联快速新建人物 ---------------- */

export interface QuickPersonInput {
  name: string;
  type: PersonType;
}

export function showPersonQuickCreate(
  onConfirm: (input: QuickPersonInput) => void,
  onCancel?: () => void
): void {
  const backdrop = el("div", { class: "modal-backdrop" });
  const modal = el("div", { class: "modal" });

  modal.appendChild(el("h3", { class: "modal-title" }, ["新建人物"]));
  modal.appendChild(
    el("p", { class: "modal-message" }, [
      "只填写名称和类型，之后可以在人物详情页补充生日、MBTI、描述等信息。",
    ])
  );

  /* 名称 */
  const nameGroup = el("div", { class: "form-group" });
  nameGroup.appendChild(el("label", { for: "quick-person-name" }, ["名称 *"]));
  const nameInput = el("input", {
    id: "quick-person-name",
    type: "text",
    maxlength: "50",
    placeholder: "例如：韩亨準",
  }) as HTMLInputElement;
  nameGroup.appendChild(nameInput);
  modal.appendChild(nameGroup);

  /* 类型 */
  const typeGroup = el("div", { class: "form-group" });
  typeGroup.appendChild(el("label", { for: "quick-person-type" }, ["类型"]));
  const typeSelect = el("select", {
    id: "quick-person-type",
  }) as HTMLSelectElement;
  for (const t of PERSON_TYPES) {
    typeSelect.appendChild(
      el("option", { value: t }, [PERSON_TYPE_LABELS[t]])
    );
  }
  typeGroup.appendChild(typeSelect);
  modal.appendChild(typeGroup);

  /* 错误 */
  const errorBox = el("div", {
    class: "form-error",
    style: "display:none",
  });
  modal.appendChild(errorBox);

  /* 操作 */
  const actions = el("div", { class: "modal-actions" });
  const cancelBtn = el("button", { class: "btn", type: "button" }, ["取消"]);
  cancelBtn.addEventListener("click", () => {
    cleanup();
    onCancel?.();
  });
  actions.appendChild(cancelBtn);

  const confirmBtn = el(
    "button",
    { class: "btn btn-primary", type: "button" },
    ["创建并选中"]
  );
  confirmBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      errorBox.textContent = "请输入名称。";
      errorBox.style.display = "block";
      nameInput.focus();
      return;
    }
    cleanup();
    onConfirm({
      name,
      type: typeSelect.value as PersonType,
    });
  });
  actions.appendChild(confirmBtn);
  modal.appendChild(actions);

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function cleanup() {
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmBtn.click();
    }
  });

  setTimeout(() => nameInput.focus(), 0);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      cleanup();
      onCancel?.();
    }
  });
}