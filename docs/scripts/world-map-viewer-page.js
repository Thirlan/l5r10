import { WorldMapViewer } from "./world-map-viewer.js";
import { bindMapControls } from "./world-map-controls.js";
import { bindViewerSkills, bindViewerClans } from "./world-map-viewer-controls.js";

const canvas = document.querySelector("#mapCanvas");
if (canvas) {
  const map = new WorldMapViewer("#mapCanvas", Number.parseInt(canvas.dataset.gridSize, 10));
  bindMapControls(map);
  bindViewerSkills(map);
  document.querySelectorAll("[data-map-layer]").forEach((input) => {
    input.addEventListener("change", () => map.setLayerVisibility(input.dataset.mapLayer, input.checked));
  });
  document.querySelectorAll("[data-route-preference]").forEach((input) => {
    input.addEventListener("change", () => map.setRoutePreference(input.dataset.routePreference, input.checked));
  });
  const routeActions = {
    reroll: () => map.computePath(),
    undo: () => map.removeLastWaypoint(),
    clear: () => map.clearPath(),
  };
  document.querySelectorAll("[data-route-action]").forEach((button) => {
    const action = routeActions[button.dataset.routeAction];
    if (!action) throw new TypeError(`Unknown route action: ${button.dataset.routeAction}`);
    button.addEventListener("click", action);
  });
  try {
    await map.ready;
    bindViewerClans(map);
  } catch (error) {
    console.error("Failed to initialize world map controls:", error);
    document.querySelector("#pathSummary").textContent = "Failed to load map data. Reload the page to try again.";
  }
}
