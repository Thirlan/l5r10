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
  const toolHints = {
    route: "First click sets the start; each additional click adds a waypoint (last click is the destination).",
    measure: "First click sets the start; second click sets the end. A third click starts a new measure.",
    pan: "Press and drag the map to move it.",
  };
  document.querySelectorAll('input[name="mapTool"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      map.setMapTool(input.value);
      document.querySelector("#mapToolHint").textContent = toolHints[input.value];
    });
  });
  document.querySelectorAll('input[name="distanceUnit"]').forEach((input) => {
    input.addEventListener("change", () => input.checked && map.setDistanceUnit(input.value));
  });
  document.querySelector('[data-measure-action="clear"]').addEventListener("click", () => map.clearMeasure());
  try {
    await map.ready;
    bindViewerClans(map);
  } catch (error) {
    console.error("Failed to initialize world map controls:", error);
    document.querySelector("#pathSummary").textContent = "Failed to load map data. Reload the page to try again.";
  }
}
