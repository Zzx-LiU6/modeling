import { el } from "../utils/dom";
import { navigate } from "../router";

export interface LayoutHeaderAction {
  label: string;
  title?: string;
  onClick: () => void;
}

export interface LayoutOptions {
  title: string;
  subtitle?: string;
  content: HTMLElement;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
  headerAction?: LayoutHeaderAction;
}

export function renderLayout(options: LayoutOptions): HTMLElement {
  const root = el("div", { class: "layout" });

  const header = el("header", { class: "app-header" });

  if (options.showBack) {
    const backBtn = el("button", { class: "btn btn-back", type: "button" }, [
      "← 返回",
    ]);
    backBtn.addEventListener("click", () => {
      if (options.onBack) {
        options.onBack();
        return;
      }
      navigate(options.backTo ?? "/");
    });
    header.appendChild(backBtn);
  } else {
    const brand = el("button", { class: "brand", type: "button" }, [
      "Cognitive Model",
    ]);
    brand.addEventListener("click", () => navigate("/"));
    header.appendChild(brand);
  }

  const titleWrap = el("div", { class: "app-title-wrap" });
  titleWrap.appendChild(el("h1", { class: "app-title" }, [options.title]));
  if (options.subtitle) {
    titleWrap.appendChild(
      el("p", { class: "app-subtitle" }, [options.subtitle])
    );
  }
  header.appendChild(titleWrap);

  if (options.headerAction) {
    const actionBtn = el(
      "button",
      {
        class: "header-action-btn",
        type: "button",
        title: options.headerAction.title ?? options.headerAction.label,
      },
      [options.headerAction.label]
    );
    actionBtn.addEventListener("click", options.headerAction.onClick);
    header.appendChild(actionBtn);
  }

  root.appendChild(header);

  const main = el("main", { class: "app-main" });
  main.appendChild(options.content);
  root.appendChild(main);

  return root;
}