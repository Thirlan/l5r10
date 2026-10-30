/**
 * Layer checkboxes of the 3D world map page. Each checkbox shows or hides one group of meshes.
 */

/**
 * Connects each checkbox with a data-map-layer attribute to the mesh group with the same name.
 * A checkbox without meshes is disabled, for example the ports when the map has no ports.
 * @param {ParentNode} panel Element that holds the checkboxes.
 * @param {Record<string, Array<{setEnabled: (enabled: boolean) => void}>>} groups Meshes by layer name.
 * @returns {string[]} Names of the connected layers.
 */
export function bindLayerToggles(panel, groups) {
  // Validation
  if (typeof panel?.querySelectorAll !== "function" || typeof groups !== "object" || groups === null) throw new TypeError("bindLayerToggles needs a panel element and mesh groups.");

  // Computation
  const inputs = [...panel.querySelectorAll("input[data-map-layer]")].filter((input) => Object.hasOwn(groups, input.dataset.mapLayer));
  inputs.forEach((input) => {
    const meshes = groups[input.dataset.mapLayer];
    const apply = () => meshes.forEach((mesh) => mesh.setEnabled(input.checked));
    input.disabled = meshes.length === 0;
    input.addEventListener("change", apply);
    apply();
  });
  return inputs.map((input) => input.dataset.mapLayer);
}

/**
 * Connects the settlement language radio buttons (name="settlementLanguage") to a callback, as on the 2D map.
 * @param {ParentNode} panel Element that holds the radio buttons.
 * @param {(language: string) => void} onChange Called with the value of the selected radio button.
 * @returns {number} Number of connected radio buttons.
 */
export function bindLanguageToggle(panel, onChange) {
  // Validation
  if (typeof panel?.querySelectorAll !== "function" || typeof onChange !== "function") throw new TypeError("bindLanguageToggle needs a panel element and a callback.");

  // Computation
  const inputs = [...panel.querySelectorAll('input[name="settlementLanguage"]')];
  inputs.forEach((input) => input.addEventListener("change", () => input.checked && onChange(input.value)));
  return inputs.length;
}
