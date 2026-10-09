import { WorldMapGrid } from "./world-map-grid.js";
import { bindMapControls } from "./world-map-controls.js";
import * as layers from "./world-map-layers.js";

const canvas = document.querySelector("#mapCanvas");
if (canvas) {
  const map = new WorldMapGrid("#mapCanvas", Number.parseInt(canvas.dataset.gridSize, 10));
  bindMapControls(map);

  document.querySelectorAll("[data-tool-layer]").forEach((button) => {
    const layer = button.dataset.toolLayer;
    const key = button.dataset.toolValue;
    let value = null;
    if (layer === "erase") {
      value = key || null;
    } else if (layer !== "text") {
      const catalog = layers[layer === "resourceLevel" ? "RESOURCE_LEVEL" : layer.toUpperCase()];
      const metadata = catalog?.[key];
      if (!metadata) throw new TypeError(`Unknown map tool: ${layer}.${key}`);
      value = metadata.value ?? metadata.id;
    }
    button.addEventListener("click", () => {
      map.selectTool(layer, value, layer);
      document.querySelectorAll(".tool-button.active").forEach((active) => active.classList.remove("active"));
      button.classList.add("active");
    });
  });

  document.querySelectorAll("[data-cliff-direction]").forEach((input) => {
    input.addEventListener("change", () => map.setCliffDirection(input.dataset.cliffDirection, input.checked));
  });
  document.querySelector("#brushSize").addEventListener("change", (event) => map.setBrushSize(event.target.value));
  document.querySelector("#fontSize").addEventListener("change", (event) => map.setFontSize(event.target.value));
  const fileInput = document.querySelector("#fileInput");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) map.importFromFile(file);
  });
  document.querySelector('[data-map-file="save"]').addEventListener("click", () => map.exportToFile());
  document.querySelector('[data-map-file="load"]').addEventListener("click", () => fileInput.click());
  document.querySelector('[data-map-file="clear"]').addEventListener("click", () => map.clearAllLayers());
  try {
    await map.ready;
  } catch (error) {
    console.error("Failed to start map builder:", error);
    alert("Failed to load map data. Reload the page to try again.");
  }
}
