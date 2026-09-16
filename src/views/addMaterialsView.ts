import { store } from "../store";
import { navigate } from "../router";
import { el, clear } from "../utils/dom";
import { formatDate } from "../utils/date";
import { renderLayout } from "../components/layout";

export function renderAddMaterials(
  container: HTMLElement,
  analysisId: string
): void {
  clear(container);
  const found = store.getAnalysis(analysisId);
  if (!found) {
    const nf = el("div", { class: "empty-state" }, ["未找到该研究。"]);
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

  // 缓存到新 const，避免闭包内 narrow 失效
  const analysis = found;
  const alreadyIds = new Set(analysis.materialIds);

  const content = el("div", { class: "view-add-materials" });

  /* 上下文 */
  const ctx = el("section", { class: "analysis-context" });
  ctx.appendChild(
    el("div", { class: "context-label" }, ["正在为研究添加材料"])
  );
  ctx.appendChild(
    el("h2", { class: "context-title" }, [
      analysis.title || "（未命名研究）",
    ])
  );
  ctx.appendChild(
    el("p", { class: "context-note" }, [
      "搜索并选择相关材料，可以一次加入多份。",
    ])
  );
  content.appendChild(ctx);

  /* 搜索 */
  const searchWrap = el("div", { class: "library-search" });
  const searchInput = el("input", {
    type: "search",
    class: "search-input",
    placeholder: "搜索标题、内容、来源、标签…",
  }) as HTMLInputElement;
  searchWrap.appendChild(searchInput);
  content.appendChild(searchWrap);

  /* 已选 */
  const selected = new Set<string>();

  const selectedWrap = el("div", { class: "selected-chips" });
  content.appendChild(selectedWrap);

  function renderSelected(): void {
    clear(selectedWrap);
    if (selected.size === 0) return;
    selectedWrap.appendChild(
      el("span", { class: "selected-chips-label" }, [
        `已选 ${selected.size} 份：`,
      ])
    );
    for (const mid of selected) {
      const m = store.getMaterial(mid);
      if (!m) continue;
      const chip = el("span", { class: "selected-chip" });
      chip.appendChild(el("span", {}, [m.title]));
      const x = el(
        "button",
        { type: "button", class: "selected-chip-remove", title: "移除" },
        ["×"]
      );
      x.addEventListener("click", () => {
        selected.delete(mid);
        renderSelected();
        renderList();
      });
      chip.appendChild(x);
      selectedWrap.appendChild(chip);
    }
  }

  /* 列表 */
  const listWrap = el("div", { class: "material-picker" });
  content.appendChild(listWrap);

  function renderList(): void {
    clear(listWrap);
    const q = searchInput.value.trim();
    const results = store.searchMaterials(q, {});

    const filtered = results.filter((m) => !alreadyIds.has(m.id));

    if (filtered.length === 0) {
      listWrap.appendChild(
        el("p", { class: "rn-placeholder" }, [
          store.getMaterials().length === 0
            ? "还没有任何材料。"
            : "没有可添加的材料。",
        ])
      );
      return;
    }

    for (const m of filtered) {
      const row = el("label", { class: "material-picker-row" });
      const cb = el("input", {
        type: "checkbox",
        value: m.id,
      }) as HTMLInputElement;
      if (selected.has(m.id)) cb.checked = true;
      cb.addEventListener("change", () => {
        if (cb.checked) selected.add(m.id);
        else selected.delete(m.id);
        renderSelected();
      });
      row.appendChild(cb);
      const info = el("div", { class: "material-picker-info" });
      info.appendChild(
        el("div", { class: "material-picker-title" }, [m.title])
      );
      const metaParts = [formatDate(m.date)];
      if (m.source) metaParts.push(m.source);
      if (m.tags.length > 0)
        metaParts.push(m.tags.map((t) => `#${t}`).join(" "));
      info.appendChild(
        el("div", { class: "material-picker-meta" }, [metaParts.join(" · ")])
      );
      row.appendChild(info);
      listWrap.appendChild(row);
    }
  }

  searchInput.addEventListener("input", renderList);
  renderSelected();
  renderList();

  /* 操作 */
  const buttons = el("div", { class: "form-actions" });
  const confirmBtn = el(
    "button",
    { type: "button", class: "btn btn-primary" },
    ["确认添加"]
  );
  confirmBtn.addEventListener("click", () => {
    if (selected.size === 0) {
      navigate(`/analysis/${encodeURIComponent(analysisId)}`);
      return;
    }
    store.addMaterialsToAnalysis(analysisId, Array.from(selected));
    navigate(`/analysis/${encodeURIComponent(analysisId)}`);
  });
  buttons.appendChild(confirmBtn);

  const cancelBtn = el("button", { type: "button", class: "btn" }, ["取消"]);
  cancelBtn.addEventListener("click", () =>
    navigate(`/analysis/${encodeURIComponent(analysisId)}`)
  );
  buttons.appendChild(cancelBtn);
  content.appendChild(buttons);

  container.appendChild(
    renderLayout({
      title: "添加相关材料",
      showBack: true,
      backTo: `/analysis/${encodeURIComponent(analysisId)}`,
      content,
    })
  );
}