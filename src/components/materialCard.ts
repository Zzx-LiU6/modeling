import type { Material } from "../types/model";
import { el } from "../utils/dom";
import { formatDate } from "../utils/date";
import { store } from "../store";
import { navigate } from "../router";

export function renderMaterialCard(
  material: Material,
  analysisCount: number
): HTMLElement {
  const li = el("li", { class: "material-card" });
  const btn = el("button", { class: "material-card-inner", type: "button" });
  btn.addEventListener("click", () =>
    navigate(`/materials/${encodeURIComponent(material.id)}`)
  );

  btn.appendChild(el("div", { class: "material-card-title" }, [material.title]));

  const metaParts: string[] = [formatDate(material.date)];
  if (material.source) metaParts.push(material.source);
  if (analysisCount > 0) metaParts.push(`被 ${analysisCount} 条研究引用`);
  btn.appendChild(el("div", { class: "material-card-meta" }, metaParts));

  if (material.personIds.length > 0) {
    const personsWrap = el("div", { class: "material-card-persons" });
    for (const pid of material.personIds) {
      const p = store.getPerson(pid);
      if (!p) continue;
      personsWrap.appendChild(
        el("span", { class: "person-chip-mini" }, [p.name])
      );
    }
    btn.appendChild(personsWrap);
  }

  if (material.tags.length > 0) {
    const tagsWrap = el("div", { class: "material-card-tags" });
    for (const t of material.tags) {
      tagsWrap.appendChild(el("span", { class: "tag-chip" }, [t]));
    }
    btn.appendChild(tagsWrap);
  }

  li.appendChild(btn);
  return li;
}