export type Route =
  | { name: "home" }
  | { name: "newPerson" }
  | { name: "editPerson"; personId: string }
  | { name: "personDetail"; personId: string }
  | { name: "newResearch"; personId: string }
  | { name: "functionDetail"; personId: string; fn: string }
  | { name: "materials" }
  | { name: "newMaterial" }
  | { name: "editMaterial"; materialId: string }
  | { name: "materialDetail"; materialId: string }
  | { name: "addAnalysis"; materialId: string }
  | { name: "researchDetail"; analysisId: string }
  | { name: "editResearch"; analysisId: string }
  | { name: "addMaterialsToResearch"; analysisId: string }
  | { name: "notFound" };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, "") || "/";
  const pathPart = raw.split("?")[0];
  const parts = pathPart.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "new") return { name: "newPerson" };

  if (parts[0] === "person" && parts[1]) {
    const personId = decodeURIComponent(parts[1]);
    if (parts.length === 2) return { name: "personDetail", personId };
    if (parts[2] === "edit") return { name: "editPerson", personId };
    if (parts[2] === "new-research")
      return { name: "newResearch", personId };
    if (parts[2] === "add-analysis")
      return { name: "newResearch", personId };
    if (parts[2] === "function" && parts[3]) {
      return {
        name: "functionDetail",
        personId,
        fn: decodeURIComponent(parts[3]),
      };
    }
  }

  if (parts[0] === "materials") {
    if (parts.length === 1) return { name: "materials" };
    if (parts[1] === "new") return { name: "newMaterial" };
    const materialId = decodeURIComponent(parts[1]);
    if (parts.length === 2) return { name: "materialDetail", materialId };
    if (parts[2] === "edit") return { name: "editMaterial", materialId };
    if (parts[2] === "add-analysis")
      return { name: "addAnalysis", materialId };
  }

  if (parts[0] === "analysis" && parts[1]) {
    const analysisId = decodeURIComponent(parts[1]);
    if (parts.length === 1) return { name: "researchDetail", analysisId };
    if (parts[2] === "edit") return { name: "editResearch", analysisId };
    if (parts[2] === "add-materials")
      return { name: "addMaterialsToResearch", analysisId };
  }

  return { name: "notFound" };
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function onRouteChange(handler: (route: Route) => void): () => void {
  const listener = () => handler(parseHash(window.location.hash));
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}