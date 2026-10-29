/**
 * Cell inspector of the 3D world map. It shows the coordinates and the layer values of the cell under the pointer.
 * The cell comes from the picked world position, so it does not depend on the chunk size or the mesh vertices.
 */
import { SETTLEMENT } from "../../scripts/world/world-map-layers.js";

/** Smallest time between two hover picks, in milliseconds. */
const HOVER_INTERVAL = 80;
const LAYER_ROWS = Object.freeze([
  ["Terrain", "terrain"],
  ["Climate", "climate"],
  ["Vegetation", "vegetation"],
  ["River", "river"],
  ["Infrastructure", "infrastructure"],
  ["Clan", "clan"],
  ["Resource", "resource"],
]);

/**
 * Finds the map cell at a world position.
 * @param {{x: number, z: number}} point World position.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {{x: number, y: number} | null} Column and row, or null outside the map.
 */
export function cellAtWorld(point, size) {
  // Validation
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.z)) throw new TypeError("cellAtWorld needs a point with finite x and z.");

  // Computation
  const [x, y] = [Math.floor(point.x), Math.floor(size.rows - point.z)];
  return x >= 0 && y >= 0 && x < size.columns && y < size.rows ? { x, y } : null;
}

/**
 * Describes one cell for the inspector.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number} x Column.
 * @param {number} y Row.
 * @returns {Array<[string, string]>} Rows of name and value.
 */
export function describeCell(field, x, y) {
  // Validation
  if (!field?.model?.contains?.(x, y)) throw new TypeError(`describeCell needs a cell inside the map, not ${x}, ${y}.`);

  // Computation
  const model = field.model;
  const settlement = model.valueAt("settlement", x, y);
  const saved = model.savedCell(x, y);
  const names = [saved.englishName, saved.rokuganiName].filter(Boolean).join(" / ");
  const settlementText = settlement === SETTLEMENT.NONE ? settlement.name : [settlement.name, names].filter(Boolean).join(": ");
  return [["Cell", `${x}, ${y}`], ["Height", field.sample(x + 0.5, y + 0.5).toFixed(2)], ...LAYER_ROWS.map(([title, layer]) => [title, model.valueAt(layer, x, y).name]), ["Settlement", settlementText]];
}

/**
 * Writes the inspector rows into a description list.
 * @param {HTMLElement} output Description list element.
 * @param {Array<[string, string]>} rows Rows of name and value.
 * @returns {void}
 */
function showRows(output, rows) {
  output.replaceChildren(
    ...rows.flatMap(([title, value]) => {
      const [term, detail] = [document.createElement("dt"), document.createElement("dd")];
      term.textContent = title;
      detail.textContent = value;
      return [term, detail];
    }),
  );
}

/**
 * Shows the cell under the pointer in the inspector. A click pins the cell; the next click releases it.
 * @param {BABYLON.Scene} scene Scene.
 * @param {BABYLON.AbstractMesh[]} chunks Terrain chunk meshes. Only these meshes are picked.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {HTMLElement} output Description list element.
 * @returns {void}
 */
export function bindCellInspector(scene, chunks, field, output) {
  // Validation
  if (!scene || !Array.isArray(chunks) || !field || !output) throw new TypeError("bindCellInspector needs a scene, the terrain chunks, a height field, and an output element.");

  // Computation
  const terrain = new Set(chunks);
  const size = { columns: field.model.columns, rows: field.model.rows };
  const state = { pinned: false, lastHover: 0 };
  const pickCell = () => {
    const hit = scene.pick(scene.pointerX, scene.pointerY, (mesh) => terrain.has(mesh));
    return hit?.hit ? cellAtWorld(hit.pickedPoint, size) : null;
  };
  const show = (cell) => {
    if (!cell) return output.replaceChildren();
    const rows = describeCell(field, cell.x, cell.y);
    showRows(output, state.pinned ? [[rows[0][0], `${rows[0][1]} (pinned, click to release)`], ...rows.slice(1)] : rows);
  };
  scene.skipPointerMovePicking = true;
  scene.onPointerObservable.add((event) => {
    if (event.type === BABYLON.PointerEventTypes.POINTERTAP) {
      state.pinned = !state.pinned;
      show(pickCell());
    } else if (event.type === BABYLON.PointerEventTypes.POINTERMOVE && !state.pinned && performance.now() - state.lastHover >= HOVER_INTERVAL) {
      state.lastHover = performance.now();
      show(pickCell());
    }
  });
}
