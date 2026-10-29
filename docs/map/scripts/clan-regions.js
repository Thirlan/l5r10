/**
 * Clan regions for the 3D world map. The terrain shader tints each clan cell with the clan fill color
 * and draws the clan border color where the next cell has a different clan, as on the 2D map.
 */
import { getClanColors } from "../../scripts/clan-colors.js";
import { CLAN } from "../../scripts/world/world-map-layers.js";

/** Number of clan palette entries. Clan IDs go from 0 (no clan) to CLAN_SLOTS - 1. */
export const CLAN_SLOTS = Math.max(...Object.values(CLAN).map((clan) => clan.id)) + 1;

/**
 * @param {string} hex Color as #RRGGBB.
 * @returns {number[]} Red, green, and blue from 0 to 1.
 */
export function hexToRgb(hex) {
  // Validation
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new TypeError(`hexToRgb needs a #RRGGBB color, not ${hex}.`);

  // Computation
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
}

/**
 * Packs the clan ID texture: one byte for each cell. Rows are in map row order, so row 0 is north.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @returns {Uint8Array} Clan ID of each cell.
 */
export function packClanIds(model) {
  // Validation
  if (!model || typeof model.ids !== "function") throw new TypeError("packClanIds needs a MapModel.");

  // Computation
  return Uint8Array.from(model.ids("clan"));
}

/**
 * Makes the clan palette for the shader. A color with alpha 0 is not drawn (no clan).
 * @returns {{fill: number[], border: number[]}} RGBA values for each clan ID, 4 for each clan.
 */
export function clanPalette() {
  const clans = Array.from({ length: CLAN_SLOTS }, (_, id) => Object.values(CLAN).find((clan) => clan.id === id));
  const toRgba = (hex) => (hex ? [...hexToRgb(hex), 1] : [0, 0, 0, 0]);
  return {
    fill: clans.flatMap((clan) => toRgba(clan && getClanColors(clan).fill)),
    border: clans.flatMap((clan) => toRgba(clan && getClanColors(clan).border)),
  };
}

/**
 * Makes the layer toggle of the clan regions. The terrain material can come later, when the textures are ready.
 * @returns {{enabled: boolean, setEnabled: (enabled: boolean) => void, attach: (material: {setFloat: (name: string, value: number) => void}) => void}} Clan layer.
 */
export function createClanLayer() {
  const layer = {
    enabled: true,
    material: null,
    setEnabled(enabled) {
      layer.enabled = enabled;
      layer.material?.setFloat("clanStrength", enabled ? 1 : 0);
    },
    attach(material) {
      layer.material = material;
      layer.setEnabled(layer.enabled);
    },
  };
  return layer;
}
