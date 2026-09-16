import type { PersonModel, FunctionModel } from "../types/model";
import {
  CONFIDENCE_LABELS,
  EVIDENCE_LEVEL_LABELS,
  TENDENCY_LABELS,
} from "../types/enums";
import { el } from "../utils/dom";
import { navigate } from "../router";

export function renderFunctionModel(
  model: PersonModel,
  personId: string
): HTMLElement {
  const wrap = el("div", { class: "function-model" });
  const ul = el("ul", { class: "function-list" });
  for (const fm of model.functions) {
    ul.appendChild(renderFunctionCard(fm, personId));
  }
  wrap.appendChild(ul);
  return wrap;
}

function renderFunctionCard(fm: FunctionModel, personId: string): HTMLElement {
  const li = el("li", {
    class: `function-card tendency-${fm.overallTendency}`,
  });
  const btn = el("button", { class: "function-card-inner", type: "button" });
  btn.addEventListener("click", () => {
    navigate(
      `/person/${encodeURIComponent(personId)}/function/${fm.function}`
    );
  });

  btn.appendChild(el("div", { class: "fn-name" }, [fm.function]));
  btn.appendChild(
    el("div", { class: "fn-tendency" }, [
      `综合倾向：${TENDENCY_LABELS[fm.overallTendency]}`,
    ])
  );
  btn.appendChild(
    el("div", { class: "fn-confidence" }, [
      `支持置信度：${CONFIDENCE_LABELS[fm.confidenceLabel]}`,
    ])
  );
  btn.appendChild(
    el("div", { class: "fn-evidence" }, [
      `证据充分度：${EVIDENCE_LEVEL_LABELS[fm.evidenceLevel]}`,
    ])
  );
  btn.appendChild(
    el("div", { class: "fn-counts" }, [
      `支持 ${fm.supportCount} 条 · 反证 ${fm.againstCount} 条`,
    ])
  );

  if (fm.overallTendency === "balanced") {
    btn.appendChild(el("div", { class: "fn-note" }, ["支持与反证并存"]));
  }

  li.appendChild(btn);
  return li;
}