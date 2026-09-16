import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { renderLayout } from "../components/layout";

export function renderHowItWorks(container: HTMLElement): void {
  clear(container);

  const content = el("div", { class: "view-how-it-works" });

  content.appendChild(
    el("p", { class: "hiw-lead" }, [
      "Cognitive Model 是一个以「材料优先」为核心的人物观察工具。",
    ])
  );
  content.appendChild(
    el("p", { class: "hiw-sub" }, [
      "先保存发生过的事情，再慢慢形成你对一个人的理解。",
    ])
  );

  content.appendChild(
    el("blockquote", { class: "hiw-quote" }, [
      "You don't need to know what it means before you save it.",
    ])
  );

  content.appendChild(
    el("blockquote", { class: "hiw-quote hiw-quote-secondary" }, [
      "You can start with a material, not a theory.",
    ])
  );

  const diagram = el("div", { class: "hiw-diagram" });
  const stages: { label: string; desc: string }[] = [
    { label: "Person", desc: "你正在观察的人。" },
    {
      label: "Materials",
      desc: "发生过的事情和原始材料。采访、聊天、Bubble、事件记录都可以。",
    },
    {
      label: "Research",
      desc: "把相关材料放在一起，并记录自己的观察、想法和判断。研究不要求从一开始就有正式问题。",
    },
    {
      label: "Person Model",
      desc: "随着材料和研究积累，对人物形成的逐渐稳定的理解。",
    },
    {
      label: "Optional Theory",
      desc: "可选的解释框架，例如 Jungian cognitive functions。理论不是使用 Cognitive Model 的前提。",
    },
  ];
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const item = el("div", { class: "hiw-stage" });
    item.appendChild(el("div", { class: "hiw-stage-label" }, [s.label]));
    item.appendChild(el("div", { class: "hiw-stage-desc" }, [s.desc]));
    diagram.appendChild(item);
    if (i < stages.length - 1) {
      diagram.appendChild(el("div", { class: "hiw-arrow" }, ["↓"]));
    }
  }
  content.appendChild(diagram);

  const actions = el("div", { class: "hiw-actions" });
  const toHome = el(
    "button",
    { class: "btn btn-primary", type: "button" },
    ["开始使用"]
  );
  toHome.addEventListener("click", () => navigate("/"));
  actions.appendChild(toHome);
  content.appendChild(actions);

  container.appendChild(
    renderLayout({
      title: "How it works",
      showBack: true,
      backTo: "/",
      content,
    })
  );
}