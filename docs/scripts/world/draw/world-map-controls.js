/**
 * @param {import("./world-map-common.js").WorldMapRenderer} map Map instance.
 * @param {Document} [root=document] Page document.
 * @returns {void}
 */
export function bindMapControls(map, root = document) {
  root.querySelectorAll("[data-map-zoom]").forEach((button) => {
    const actions = {
      in: () => map.zoomIn(),
      out: () => map.zoomOut(),
      reset: () => map.resetZoom(),
      fit: () => map.fitToWidth(),
    };
    const action = actions[button.dataset.mapZoom];
    if (!action) throw new TypeError(`Unknown map zoom action: ${button.dataset.mapZoom}`);
    button.addEventListener("click", action);
  });
  root.querySelectorAll('input[name="settlementLanguage"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) map.setSettlementLanguage(input.value);
    });
  });
}
