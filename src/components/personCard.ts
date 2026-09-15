import type { Person } from "../types/model";
import { PERSON_TYPE_LABELS } from "../types/enums";
import { el } from "../utils/dom";
import { formatDateTime } from "../utils/date";
import { store } from "../store";
import { navigate } from "../router";

export function renderPersonCard(person: Person): HTMLElement {
  const materials = store.getMaterialsForPerson(person.id);
  const analyses = store.getAnalysesForPerson(person.id);

  let traitCount = 0;
  let evidenceCount = 0;
  for (const a of analyses) {
    traitCount += a.traits.length;
    evidenceCount += a.evidence.length;
  }

  const li = el("li", { class: "person-card" });
  const card = el("div", { class: "person-card-inner" });

  const mainBtn = el("button", {
    class: "person-card-main",
    type: "button",
  });
  mainBtn.addEventListener("click", () =>
    navigate(`/person/${encodeURIComponent(person.id)}`)
  );
  card.appendChild(mainBtn);

  const pinBtn = el(
    "button",
    {
      class: `person-pin-btn ${person.pinned ? "active" : ""}`,
      type: "button",
      title: person.pinned ? "取消置顶" : "置顶",
    },
    [person.pinned ? "📌" : "📍"]
  );
  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    store.togglePersonPin(person.id);
  });
  card.appendChild(pinBtn);

  mainBtn.appendChild(
    el("div", { class: "person-card-title" }, [person.name])
  );

  const metaParts: string[] = [
    PERSON_TYPE_LABELS[person.type],
    `材料 ${materials.length} 份`,
    `研究 ${analyses.length} 条`,
  ];
  if (traitCount > 0) metaParts.push(`人物判断 ${traitCount} 条`);
  if (evidenceCount > 0) metaParts.push(`八维证据 ${evidenceCount} 条`);
  metaParts.push(`更新于 ${formatDateTime(person.updatedAt)}`);

  mainBtn.appendChild(el("div", { class: "person-card-meta" }, metaParts));

  if (person.description) {
    mainBtn.appendChild(
      el("div", { class: "person-card-desc" }, [person.description])
    );
  }

  li.appendChild(card);
  return li;
}
