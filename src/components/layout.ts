import { el } from "../utils/dom";
import { navigate } from "../router";

export interface LayoutOptions {
  title: string;
  content: HTMLElement;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
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
  header.appendChild(el("h1", { class: "app-title" }, [options.title]));
  root.appendChild(header);

  const main = el("main", { class: "app-main" });
  main.appendChild(options.content);
  root.appendChild(main);

  return root;
}