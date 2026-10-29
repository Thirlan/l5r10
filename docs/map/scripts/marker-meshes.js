/**
 * Settlement and resource marker meshes for the 3D world map.
 * The icons come from the 2D map drawing functions, so the 3D markers look like the 2D markers.
 */
import { getClanColors } from "../../scripts/clan-colors.js";
import { CLAN } from "../../scripts/world/world-map-layers.js";
import { getResourceImage } from "../../scripts/world/world-map-img-resources.js";
import { NEUTRAL_SETTLEMENT_COLORS, drawSettlementMarker, getSettlementAsset } from "../../scripts/world/world-map-img-settlements.js";
import { ICON_PIXELS, MARKER_STYLES, iconAtlasLayout, markerGeometry, resourceMarkers, settlementMarkers } from "./marker-layout.js";
import { createMarkerMaterial } from "./marker-material.js";

/** Size of one 2D map cell in pixels. The 2D icons are drawn for this cell size. */
const MAP_CELL_PIXELS = 16;
/** Bounding box margin, because the shader scales far markers up. */
const BOUNDS_MARGIN = 2;

const loadedImages = new Map();

/**
 * Loads one image once. The 2D asset paths are relative to the page, and the 3D page is at the same folder depth.
 * @param {string} source Image path.
 * @returns {Promise<HTMLImageElement|null>} Loaded image, or null when it does not load.
 */
function loadImage(source) {
  if (!loadedImages.has(source)) {
    const image = new Image();
    image.src = source;
    loadedImages.set(
      source,
      image.decode().then(
        () => image,
        () => {
          console.error(`The 3D map could not load the marker image ${source}.`);
          return null;
        },
      ),
    );
  }
  return loadedImages.get(source);
}

/**
 * Draws one icon into its atlas cell with the 2D drawing function of its layer.
 * @param {CanvasRenderingContext2D} context Atlas context.
 * @param {object} marker Marker from settlementMarkers or resourceMarkers.
 * @param {HTMLImageElement|null} image Asset image, or null.
 * @param {object} tintedIconCache Cache for the tinted 2D assets.
 * @returns {void}
 */
function drawIcon(context, marker, image, tintedIconCache) {
  const center = MAP_CELL_PIXELS / 2;
  if (marker.settlement) {
    const clanColors = marker.clan === CLAN.NONE ? NEUTRAL_SETTLEMENT_COLORS : getClanColors(marker.clan);
    drawSettlementMarker(context, marker.settlement, image, center, center, 1, clanColors, tintedIconCache);
  } else if (image) {
    const size = MAP_CELL_PIXELS * 0.75;
    context.drawImage(image, center - size / 2, center - size / 2, size, size);
  }
}

/**
 * Draws all marker icons into one atlas canvas.
 * @param {Array<object>} markers Markers of all layers.
 * @param {ReturnType<typeof iconAtlasLayout>} layout Atlas layout.
 * @returns {Promise<HTMLCanvasElement>} Atlas canvas.
 */
async function drawIconAtlas(markers, layout) {
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  const firstOfKey = [...new Map(markers.map((marker) => [marker.key, marker])).values()];
  const assetOf = (marker) => (marker.settlement ? getSettlementAsset(marker.settlement) : getResourceImage(marker.resource));
  const images = await Promise.all(firstOfKey.map((marker) => (assetOf(marker) ? loadImage(assetOf(marker)) : null)));
  const tintedIconCache = {};
  firstOfKey.forEach((marker, index) => {
    const rect = layout.rects.get(marker.key);
    context.save();
    context.translate(rect.left, rect.top);
    context.scale(ICON_PIXELS / MAP_CELL_PIXELS, ICON_PIXELS / MAP_CELL_PIXELS);
    drawIcon(context, marker, images[index], tintedIconCache);
    context.restore();
  });
  return canvas;
}

/**
 * Makes one mesh from the marker geometry of one chunk.
 * @param {BABYLON.Scene} scene Scene.
 * @param {string} name Mesh name.
 * @param {ReturnType<typeof markerGeometry> extends Map<number, infer T> ? T : never} group Geometry of one chunk.
 * @param {BABYLON.Material} material Marker material.
 * @returns {BABYLON.Mesh} Marker mesh.
 */
export function createMarkerMesh(scene, name, group, material) {
  const mesh = new BABYLON.Mesh(name, scene);
  mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, group.positions, false, 3);
  mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, group.uvs, false, 2);
  mesh.setVerticesData("corner", group.corners, false, 2);
  mesh.setVerticesData("shape", group.shapes, false, 2);
  mesh.setIndices(group.indices);
  const { minimum, maximum } = mesh.getBoundingInfo();
  const margin = new BABYLON.Vector3(BOUNDS_MARGIN, BOUNDS_MARGIN, BOUNDS_MARGIN);
  mesh.setBoundingInfo(new BABYLON.BoundingInfo(minimum.subtract(margin), maximum.add(margin)));
  mesh.material = material;
  mesh.isPickable = false;
  mesh.metadata = { chunk: group.chunk, count: group.count };
  mesh.freezeWorldMatrix();
  return mesh;
}

/**
 * Creates the settlement and resource marker meshes, with one mesh for each chunk and layer.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{chunkCells: number}} options Chunk size.
 * @returns {Promise<{settlements: BABYLON.Mesh[], resources: BABYLON.Mesh[]}>} Marker meshes by layer.
 */
export async function createMarkerMeshes(scene, field, options) {
  // Validation
  if (!scene || !field || !Number.isInteger(options?.chunkCells)) throw new TypeError("createMarkerMeshes needs a scene, a height field, and a chunk size.");

  // Computation
  const layers = { settlements: settlementMarkers(field.model), resources: resourceMarkers(field.model) };
  const allMarkers = [...layers.settlements, ...layers.resources];
  const layout = iconAtlasLayout(allMarkers.map((marker) => marker.key));
  const canvas = await drawIconAtlas(allMarkers, layout);
  const atlas = new BABYLON.DynamicTexture("markerAtlas", canvas, scene, true);
  atlas.hasAlpha = true;
  atlas.update();
  const material = createMarkerMaterial(scene, "markerMaterial", atlas);
  return Object.fromEntries(Object.entries(layers).map(([layer, markers]) => [layer, [...markerGeometry(field, markers, layout, MARKER_STYLES.get(layer), options.chunkCells).values()].map((group) => createMarkerMesh(scene, `${layer}_${group.chunk}`, group, material))]));
}
