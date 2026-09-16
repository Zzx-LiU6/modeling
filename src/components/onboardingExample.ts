import { el, clear } from "../utils/dom";

const TOTAL_STEPS = 6;

export interface OnboardingExampleOptions {
  onFinish: () => void;
}

export function showOnboardingExample(
  options: OnboardingExampleOptions
): void {
  let currentStep = 0;

  const backdrop = el("div", {
    class: "modal-backdrop onboarding-backdrop",
  });
  const modal = el("div", { class: "modal onboarding-modal" });
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function cleanup(): void {
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function render(): void {
    clear(modal);

    /* 进度指示 */
    const indicator = el("div", { class: "onboarding-indicator" });
    for (let i = 0; i < TOTAL_STEPS; i++) {
      indicator.appendChild(
        el("span", {
          class: `onboarding-dot ${i === currentStep ? "active" : ""}`,
        })
      );
    }
    modal.appendChild(indicator);

    /* 正文 */
    const body = el("div", { class: "onboarding-body" });
    renderStep(body, currentStep);
    modal.appendChild(body);

    /* 操作按钮 */
    const actions = el("div", { class: "onboarding-actions" });

    if (currentStep > 0) {
      const backBtn = el(
        "button",
        { class: "btn", type: "button" },
        ["返回"]
      );
      backBtn.addEventListener("click", () => {
        currentStep--;
        render();
      });
      actions.appendChild(backBtn);
    }

    const isLast = currentStep === TOTAL_STEPS - 1;
    const nextBtn = el(
      "button",
      { class: "btn btn-primary", type: "button" },
      [isLast ? "创建第一个人物" : "下一步"]
    );
    nextBtn.addEventListener("click", () => {
      if (isLast) {
        cleanup();
        options.onFinish();
        return;
      }
      currentStep++;
      render();
    });
    actions.appendChild(nextBtn);

    modal.appendChild(actions);
  }

  render();
}

/* ---------------- 步骤渲染 ---------------- */

function renderStep(container: HTMLElement, step: number): void {
  switch (step) {
    case 0:
      renderStep1(container);
      break;
    case 1:
      renderStep2(container);
      break;
    case 2:
      renderStep3(container);
      break;
    case 3:
      renderStep4(container);
      break;
    case 4:
      renderStep5(container);
      break;
    case 5:
      renderStep6(container);
      break;
  }
}

function stepLabel(text: string): HTMLElement {
  return el("div", { class: "onboarding-step-label" }, [text]);
}

function materialCard(title: string, content: string): HTMLElement {
  const card = el("div", { class: "onboarding-material" });
  card.appendChild(
    el("div", { class: "onboarding-material-label" }, ["Material"])
  );
  card.appendChild(el("div", { class: "onboarding-material-title" }, [title]));
  card.appendChild(
    el("p", { class: "onboarding-material-content" }, [content])
  );
  return card;
}

/* ① 先保存材料 */
function renderStep1(c: HTMLElement): void {
  c.appendChild(stepLabel("① 先保存材料"));

  c.appendChild(
    el("p", { class: "onboarding-lead" }, [
      "假设你正在观察一个人。你注意到了一件事。",
    ])
  );

  c.appendChild(
    materialCard(
      "Alex 最近的一次聊天",
      "Alex 在聊天中提到，他最近又买了一本和以前完全不同类型的书。"
    )
  );

  c.appendChild(
    el("p", { class: "onboarding-narration" }, [
      "这只是一个观察到的事情。你不需要现在判断这意味着什么。",
    ])
  );
}

/* ② 再保存一个材料 */
function renderStep2(c: HTMLElement): void {
  c.appendChild(stepLabel("② 再保存一个材料"));

  c.appendChild(
    el("p", { class: "onboarding-lead" }, [
      "几天后，你又注意到了一件事。",
    ])
  );

  c.appendChild(
    materialCard(
      "Alex 的学习计划",
      "几天后，Alex 又提到自己最近突然开始学习一个以前完全没接触过的领域。"
    )
  );

  c.appendChild(
    el("p", { class: "onboarding-narration" }, [
      "不需要每条材料都马上分析。",
    ])
  );

  c.appendChild(
    el("p", { class: "onboarding-hint" }, [
      "材料可以先积累，之后再看也不迟。",
    ])
  );
}

/* ③ 把材料放在一起（重点步骤） */
function renderStep3(c: HTMLElement): void {
  c.appendChild(stepLabel("③ 把材料放在一起"));

  c.appendChild(
    el("p", { class: "onboarding-lead" }, [
      "某一天，你发现这两份材料可以放在一起看。",
    ])
  );

  /* Material A + Material B 堆叠 */
  const stack = el("div", { class: "onboarding-stack" });

  const matA = el("div", {
    class: "onboarding-material onboarding-material-compact",
  });
  matA.appendChild(
    el("div", { class: "onboarding-material-label" }, ["Material A"])
  );
  matA.appendChild(
    el("p", { class: "onboarding-material-content" }, [
      "Alex 买了一本完全不同类型的书。",
    ])
  );
  stack.appendChild(matA);

  stack.appendChild(el("div", { class: "onboarding-plus" }, ["+"]));

  const matB = el("div", {
    class: "onboarding-material onboarding-material-compact",
  });
  matB.appendChild(
    el("div", { class: "onboarding-material-label" }, ["Material B"])
  );
  matB.appendChild(
    el("p", { class: "onboarding-material-content" }, [
      "Alex 开始学习一个以前完全没接触过的领域。",
    ])
  );
  stack.appendChild(matB);

  c.appendChild(stack);

  c.appendChild(el("div", { class: "onboarding-arrow" }, ["↓"]));

  /* Research 结果 */
  const research = el("div", { class: "onboarding-research" });
  research.appendChild(
    el("div", { class: "onboarding-research-label" }, ["Research"])
  );
  research.appendChild(
    el("blockquote", { class: "onboarding-research-quote" }, [
      "“他似乎经常主动接触自己原本不熟悉的东西。”",
    ])
  );
  c.appendChild(research);

  c.appendChild(
    el("p", { class: "onboarding-narration" }, [
      "你不需要从一开始就知道要研究什么。",
    ])
  );
  c.appendChild(
    el("p", { class: "onboarding-narration" }, [
      "当几个材料之间出现联系时，再把它们放在一起。",
    ])
  );
}

/* ④ 形成自己的理解 */
function renderStep4(c: HTMLElement): void {
  c.appendChild(stepLabel("④ 形成自己的理解"));

  c.appendChild(
    el("p", { class: "onboarding-lead" }, [
      "如果这个模式在之后不断出现，你可以把它记录下来。",
    ])
  );

  const obs = el("div", { class: "onboarding-research" });
  obs.appendChild(
    el("div", { class: "onboarding-research-label" }, ["Observation"])
  );
  obs.appendChild(
    el("p", { class: "onboarding-research-content" }, [
      "他似乎对陌生领域有持续的探索倾向。",
    ])
  );
  c.appendChild(obs);

  const trait = el("div", { class: "onboarding-trait-card" });
  trait.appendChild(
    el("div", { class: "onboarding-trait-name" }, ["探索性"])
  );
  trait.appendChild(
    el("div", { class: "onboarding-trait-desc" }, [
      "对不熟悉领域的主动接近倾向。",
    ])
  );
  c.appendChild(trait);

  c.appendChild(
    el("p", { class: "onboarding-hint" }, [
      "这些是你自己的观察和判断。",
    ])
  );
}

/* ⑤ 理论是可选的 */
function renderStep5(c: HTMLElement): void {
  c.appendChild(stepLabel("⑤ 理论是可选的"));

  c.appendChild(
    el("p", { class: "onboarding-lead" }, [
      "如果你之后希望用某种理论解释自己的观察，可以再加入。",
    ])
  );

  const theory = el("div", { class: "onboarding-theory" });
  theory.appendChild(
    el("div", { class: "onboarding-theory-label" }, ["Optional Theory"])
  );
  theory.appendChild(
    el("div", { class: "onboarding-theory-example" }, [
      "例如：Ne · 支持 · 3",
    ])
  );
  theory.appendChild(
    el("div", { class: "onboarding-theory-note" }, [
      "理论只是一层可选解释，不是入口。",
    ])
  );
  c.appendChild(theory);

  c.appendChild(
    el("blockquote", { class: "onboarding-highlight" }, [
      "理论不是入口。你可以先观察，再决定是否需要理论。",
    ])
  );

  c.appendChild(
    el("p", { class: "onboarding-hint" }, ["你也完全可以不用它。"])
  );
}

/* ⑥ 总结 + 开始使用 */
function renderStep6(c: HTMLElement): void {
  c.appendChild(stepLabel("最后一屏"));

  c.appendChild(
    el("p", { class: "onboarding-lead onboarding-lead-strong" }, [
      "现在，你可以开始了。",
    ])
  );

  const summary = el("div", { class: "onboarding-summary" });
  summary.appendChild(summaryItem("Person", "你想观察谁？"));
  summary.appendChild(summaryItem("Material", "你观察到了什么？"));
  summary.appendChild(
    summaryItem(
      "Research",
      "什么时候，你开始觉得几个材料之间出现了联系？"
    )
  );
  c.appendChild(summary);

  c.appendChild(
    el("p", { class: "onboarding-footnote" }, [
      "先不用想研究什么。先保存第一份材料就好。",
    ])
  );
}

function summaryItem(label: string, question: string): HTMLElement {
  const item = el("div", { class: "onboarding-summary-item" });
  item.appendChild(el("div", { class: "onboarding-summary-label" }, [label]));
  item.appendChild(
    el("div", { class: "onboarding-summary-question" }, [question])
  );
  return item;
}