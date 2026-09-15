import { store } from "../store";
import { el, clear } from "../utils/dom";
import {
  COGNITIVE_FUNCTIONS,
  FUNCTION_DESCRIPTIONS,
  CONFIDENCE_LABELS,
  EVIDENCE_LEVEL_LABELS,
  TENDENCY_LABELS,
  DIRECTION_LABELS,
  STRENGTH_LABELS,
  type CognitiveFunction,
} from "../types/enums";
import { computeFunctionModel } from "../core/calculations";
import { renderLayout } from "../components/layout";
import { formatDate } from "../utils/date";
import { navigate } from "../router";

export function renderFunctionDetail(
  container: HTMLElement,
  personId: string,
  fn: string
): void {
  clear(container);
  const person = store.getPerson(personId);
  if (!person || !COGNITIVE_FUNCTIONS.includes(fn as CognitiveFunction)) {
    const nf = el("div", { class: "empty-state" }, ["未找到。"]);
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
  const cogFn = fn as CognitiveFunction;
  const personAnalyses = store.getAnalysesForPerson(personId);
  const model = computeFunctionModel(cogFn, personAnalyses);

  const content = el("div", { class: "view-function-detail" });

  const header = el("section", { class: "function-header" });
  header.appendChild(
    el("h2", {}, [`${cogFn} · ${FUNCTION_DESCRIPTIONS[cogFn]}`])
  );

  const stats = el("div", { class: "function-stats" });
  stats.appendChild(
    statItem("综合倾向", TENDENCY_LABELS[model.overallTendency])
  );
  stats.appendChild(
    statItem("支持置信度", CONFIDENCE_LABELS[model.confidenceLabel])
  );
  stats.appendChild(
    statItem("证据充分度", EVIDENCE_LEVEL_LABELS[model.evidenceLevel])
  );
  stats.appendChild(statItem("支持", `${model.supportCount} 条`));
  stats.appendChild(statItem("反证", `${model.againstCount} 条`));
  stats.appendChild(statItem("支持权重", String(model.supportWeight)));
  stats.appendChild(statItem("反证权重", String(model.againstWeight)));
  stats.appendChild(statItem("净权重", String(model.netWeight)));
  header.appendChild(stats);

  if (model.overallTendency === "balanced") {
    header.appendChild(
      el("p", { class: "note" }, [
        "支持与反证同时存在，当前模型暂不稳定。",
      ])
    );
  } else if (model.totalWeight === 0) {
    header.appendChild(el("p", { class: "note" }, ["暂无相关证据。"]));
  }
  content.appendChild(header);

  const related = personAnalyses
    .filter((a) => a.evidence.some((e) => e.function === cogFn))
    .sort((a, b) => {
      const ma =
        a.materialIds.length > 0
          ? store.getMaterial(a.materialIds[0])
          : undefined;
      const mb =
        b.materialIds.length > 0
          ? store.getMaterial(b.materialIds[0])
          : undefined;
      const da = ma?.date ?? a.createdAt;
      const db = mb?.date ?? b.createdAt;
      return db.localeCompare(da);
    });

  const listSection = el("section", { class: "related-observations" });
  listSection.appendChild(el("h3", {}, [`相关研究（${related.length}）`]));

  if (related.length === 0) {
    listSection.appendChild(el("p", { class: "empty" }, ["暂无。"]));
  } else {
    const ul = el("ul", { class: "related-list" });
    for (const a of related) {
      const ev = a.evidence.find((e) => e.function === cogFn)!;
      const firstMaterialId = a.materialIds[0];
      const material = firstMaterialId
        ? store.getMaterial(firstMaterialId)
        : undefined;
      const li = el("li", { class: "related-item" });

      const head = el("div", { class: "related-head" });
      head.appendChild(
        el("span", { class: "related-date" }, [
          material ? formatDate(material.date) : "",
        ])
      );
      if (material) {
        const materialLink = el(
          "button",
          { type: "button", class: "btn-link" },
          [material.title]
        );
        materialLink.addEventListener("click", () =>
          navigate(`/materials/${encodeURIComponent(material.id)}`)
        );
        head.appendChild(materialLink);
        if (a.materialIds.length > 1) {
          head.appendChild(
            el("span", { class: "related-more" }, [
              `等 ${a.materialIds.length} 份材料`,
            ])
          );
        }
      } else if (a.materialIds.length === 0) {
        head.appendChild(
          el("span", { class: "related-more" }, ["（已无引用材料）"])
        );
      }
      li.appendChild(head);

      if (a.title) {
        const titleEl = el("p", { class: "related-title" }, [a.title]);
        titleEl.addEventListener("click", () =>
          navigate(`/analysis/${encodeURIComponent(a.id)}`)
        );
        titleEl.style.cursor = "pointer";
        titleEl.style.textDecoration = "underline";
        titleEl.style.textDecorationColor = "transparent";
        titleEl.addEventListener("mouseenter", () => {
          titleEl.style.textDecorationColor = "currentColor";
        });
        titleEl.addEventListener("mouseleave", () => {
          titleEl.style.textDecorationColor = "transparent";
        });
        li.appendChild(titleEl);
      }

      li.appendChild(
        el("div", { class: `tag tag-${ev.direction}` }, [
          `${DIRECTION_LABELS[ev.direction]} · 强度 ${ev.strength}（${STRENGTH_LABELS[ev.strength]}）`,
        ])
      );

      if (a.excerpt) {
        li.appendChild(
          el("blockquote", { class: "analysis-excerpt" }, [a.excerpt])
        );
      }
      if (a.interpretation) {
        li.appendChild(
          el("p", { class: "related-content" }, [a.interpretation])
        );
      }
      if (ev.reasoning) {
        li.appendChild(
          el("p", { class: "related-reasoning" }, [
            `判断理由：${ev.reasoning}`,
          ])
        );
      }
      ul.appendChild(li);
    }
    listSection.appendChild(ul);
  }
  content.appendChild(listSection);

  container.appendChild(
    renderLayout({
      title: `${person.name} · ${cogFn}`,
      showBack: true,
      backTo: `/person/${encodeURIComponent(personId)}`,
      content,
    })
  );
}

function statItem(label: string, value: string): HTMLElement {
  const item = el("div", { class: "stat-item" });
  item.appendChild(el("div", { class: "stat-label" }, [label]));
  item.appendChild(el("div", { class: "stat-value" }, [value]));
  return item;
}