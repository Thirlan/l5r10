import { CLAN, RESOURCE } from "./world-map-layers.js";
import { getClanColors } from "./clan-colors.js";
import { BASE_LAYER_CONTROL_IMAGES } from "./world-map-img-base-layers.js";
import { RIVER_CONTROL_IMAGES } from "./world-map-img-river.js";
import { INFRASTRUCTURE_CONTROL_IMAGES } from "./world-map-img-infrastructure.js";
import { SETTLEMENT_CONTROL_IMAGES } from "./world-map-img-settlements.js";
import { getResourceImage } from "./world-map-img-resources.js";
import { ANIMAL_CONTROL_IMAGES } from "./world-map-img-animal.js";
import { SPIRIT_CONTROL_IMAGES } from "./world-map-img-spirit.js";
import { SHADOWLAND_CONTROL_IMAGES } from "./world-map-img-shadowland.js";
import { CRIME_CONTROL_IMAGES } from "./world-map-img-crime.js";
import { RESOURCE_LEVEL_CONTROL_IMAGES } from "./world-map-img-resource-level.js";

const controlImages = new Map([
  ...BASE_LAYER_CONTROL_IMAGES, ...RIVER_CONTROL_IMAGES, ...INFRASTRUCTURE_CONTROL_IMAGES,
  ...SETTLEMENT_CONTROL_IMAGES, ...ANIMAL_CONTROL_IMAGES, ...SPIRIT_CONTROL_IMAGES,
  ...SHADOWLAND_CONTROL_IMAGES, ...CRIME_CONTROL_IMAGES, ...RESOURCE_LEVEL_CONTROL_IMAGES,
].map(({ value, image }) => [value, image]));

/**
 * @param {HTMLButtonElement} button Tool button.
 * @param {import("./world-map-layers.js").LayerValue|import("./world-map-layers.js").LevelValue} value Tool metadata.
 * @returns {void}
 */
export function setToolIcon(button, value) {
  const document = button.ownerDocument;
  let icon;
  if (Object.values(CLAN).includes(value)) {
    const colors = getClanColors(value);
    icon = document.createElement("span");
    icon.className = "terrain-color";
    icon.style.backgroundColor = colors.fill;
    icon.style.borderColor = colors.border;
  } else {
    const path = Object.values(RESOURCE).includes(value) ? getResourceImage(value) : controlImages.get(value);
    if (!path) throw new TypeError(`No tool image for ${value?.name ?? "unknown value"}.`);
    icon = document.createElement("img");
    icon.className = "control-icon";
    icon.alt = "";
    icon.src = path;
    icon.addEventListener("error", () => {
      console.error(`Failed to load map tool image: ${path}`);
      icon.replaceWith(document.createTextNode("[Image unavailable] "));
    }, { once: true });
  }
  icon.setAttribute("aria-hidden", "true");
  button.insertBefore(icon, button.firstChild);
}
