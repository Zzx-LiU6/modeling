import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

import { parseHash, onRouteChange, navigate, type Route } from "./router";
import { store } from "./store";
import { clear } from "./utils/dom";
import { renderHome } from "./views/homeView";
import { renderPersonForm } from "./views/personFormView";
import { renderPersonDetail } from "./views/personDetailView";
import { renderFunctionDetail } from "./views/functionDetailView";
import { renderMaterialLibrary } from "./views/materialLibraryView";
import { renderMaterialForm } from "./views/materialFormView";
import { renderMaterialDetail } from "./views/materialDetailView";
import { renderResearchForm } from "./views/researchFormView";
import { renderResearchDetail } from "./views/researchDetailView";
import { renderAddMaterials } from "./views/addMaterialsView";
import { renderResearchLibrary } from "./views/researchLibraryView";
import { renderHowItWorks } from "./views/howItWorksView";
import {
  isOnboarded,
  markOnboarded,
  showWelcomeModal,
} from "./components/welcomeModal";
import { showOnboardingExample } from "./components/onboardingExample";

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

function showBanner(
  kind: "error" | "notice",
  message: string,
  onClose?: () => void
): void {
  const banner = document.createElement("div");
  banner.className = `banner banner-${kind}`;
  const text = document.createElement("span");
  text.textContent = message;
  banner.appendChild(text);
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-icon";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    banner.remove();
    onClose?.();
  });
  banner.appendChild(closeBtn);
  app!.appendChild(banner);
}

function render(route: Route): void {
  clear(app!);

  /* 默认每次路由切换滚到顶部 */
  window.scrollTo(0, 0);

  /* 旧路由的客户端 redirect */
  const rawHash = window.location.hash.replace(/^#/, "");
  if (/^\/person\/[^/]+\/add-analysis(\?|$)/.test(rawHash)) {
    const parts = rawHash.split("?")[0].split("/").filter(Boolean);
    const pid = decodeURIComponent(parts[1]);
    navigate(`/person/${encodeURIComponent(pid)}/new-research`);
    return;
  }

  const err = store.consumeError();
  if (err) showBanner("error", err);

  const notice = store.consumeNotice();
  if (notice) showBanner("notice", notice);

  switch (route.name) {
    case "home":
      renderHome(app!);
      break;
    case "howItWorks":
      renderHowItWorks(app!);
      break;
    case "newPerson":
      renderPersonForm(app!);
      break;
    case "editPerson":
      renderPersonForm(app!, { editPersonId: route.personId });
      break;
    case "personDetail":
      renderPersonDetail(app!, route.personId);
      break;
    case "newResearch":
      renderResearchForm(app!, { presetPersonId: route.personId });
      break;
    case "functionDetail":
      renderFunctionDetail(app!, route.personId, route.fn);
      break;
    case "materials":
      renderMaterialLibrary(app!);
      break;
    case "researchLibrary":
      renderResearchLibrary(app!);
      break;
    case "newMaterial":
      renderMaterialForm(app!);
      break;
    case "editMaterial":
      renderMaterialForm(app!, { editMaterialId: route.materialId });
      break;
    case "materialDetail":
      renderMaterialDetail(app!, route.materialId);
      break;
    case "addAnalysis":
      renderResearchForm(app!, { presetMaterialId: route.materialId });
      break;
    case "researchDetail":
      renderResearchDetail(app!, route.analysisId);
      break;
    case "editResearch":
      renderResearchForm(app!, { editAnalysisId: route.analysisId });
      break;
    case "addMaterialsToResearch":
      renderAddMaterials(app!, route.analysisId);
      break;
    case "notFound":
      navigate("/");
      return;
  }
}

render(parseHash(window.location.hash));
onRouteChange((route) => render(route));
store.subscribe(() => render(parseHash(window.location.hash)));

/* 首次访问：无数据且未 onboarded 时弹欢迎 */
const data = store.getData();
const hasAnyData =
  data.people.length > 0 ||
  data.materials.length > 0 ||
  data.analyses.length > 0;

if (!isOnboarded() && !hasAnyData) {
  showWelcomeModal({
    onStart: () => {
      markOnboarded();
      navigate("/new");
    },
    onExample: () => {
      markOnboarded();
      showOnboardingExample({
        onFinish: () => navigate("/new"),
      });
    },
    onDismiss: () => {
      markOnboarded();
      /* 留在首页，不进行导航 */
    },
  });
}