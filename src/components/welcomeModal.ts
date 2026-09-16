import { el } from "../utils/dom";

const ONBOARDING_KEY = "cognitive-model:onboarded";

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export interface WelcomeModalOptions {
  onExample: () => void;
  onStart: () => void;
  onDismiss: () => void;
}

export function showWelcomeModal(options: WelcomeModalOptions): void {
  const backdrop = el("div", { class: "modal-backdrop welcome-backdrop" });
  const modal = el("div", {
    class: "modal welcome-modal welcome-modal-compact",
  });

  modal.appendChild(el("div", { class: "welcome-icon" }, ["🧠"]));
  modal.appendChild(el("div", { class: "welcome-eyebrow" }, ["Welcome to"]));
  modal.appendChild(el("h2", { class: "welcome-title" }, ["Cognitive Model"]));

  modal.appendChild(
    el("p", { class: "welcome-lead" }, [
      "观察一个人，保存发生过的事情，慢慢形成你自己的理解。",
    ])
  );

  modal.appendChild(
    el("blockquote", { class: "welcome-quote" }, [
      "You don't need to know what it means before you save it.",
    ])
  );

  const actions = el("div", {
    class: "welcome-actions welcome-actions-stack",
  });

  const exampleBtn = el(
    "button",
    { class: "btn", type: "button" },
    ["看一个例子"]
  );
  exampleBtn.addEventListener("click", () => {
    cleanup();
    options.onExample();
  });
  actions.appendChild(exampleBtn);

  const startBtn = el(
    "button",
    { class: "btn btn-primary", type: "button" },
    ["开始使用"]
  );
  startBtn.addEventListener("click", () => {
    cleanup();
    options.onStart();
  });
  actions.appendChild(startBtn);

  modal.appendChild(actions);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function cleanup() {
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  /* 点击 backdrop：跳过引导，标记已看过，留在首页 */
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      cleanup();
      options.onDismiss();
    }
  });
}