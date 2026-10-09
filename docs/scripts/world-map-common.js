import { LAYERS, TERRAIN, CLIMATE, VEGETATION, CLAN } from "./world-map-layers.js";
import { BASE_LAYER_IMAGES, drawBaseLayers, drawCliffEdges } from "./world-map-img-base-layers.js";
import { getClanColors } from "./clan-colors.js";
import { getSettlementAsset, getSettlementLabelSize, NEUTRAL_SETTLEMENT_COLORS } from "./world-map-img-settlements.js";
import { getResourceImage } from "./world-map-img-resources.js";
import { getInfrastructureStyle } from "./world-map-img-infrastructure.js";
import { getAnimalColor } from "./world-map-img-animal.js";
import { getSpiritColor } from "./world-map-img-spirit.js";
import { getShadowlandColor } from "./world-map-img-shadowland.js";
import { getCrimeColor } from "./world-map-img-crime.js";
import { getResourceLevelColor } from "./world-map-img-resource-level.js";

const OVERLAY_COLORS = new Map([
  [LAYERS.ANIMAL, getAnimalColor], [LAYERS.SPIRIT, getSpiritColor],
  [LAYERS.SHADOWLAND, getShadowlandColor], [LAYERS.CRIME, getCrimeColor],
  [LAYERS.RESOURCE_LEVEL, getResourceLevelColor],
]);
const MAP_DEFAULT_GRID_SIZE = 16;

// Shared rendering logic for the map builder (WorldMapGrid) and the read-only
// map viewer (WorldMapViewer). Subclasses provide their own repaint entry point
// via redraw(), plus builder- or viewer-specific behaviour (painting, routing).
export class WorldMapRenderer {
  constructor(canvasSelector, gridSize = MAP_DEFAULT_GRID_SIZE, { zoom = 0.5 } = {}) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext("2d");
    this.gridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : MAP_DEFAULT_GRID_SIZE;
    this.mapWidth = Number(this.canvas.dataset.mapColumns) * this.gridSize;
    this.mapHeight = Number(this.canvas.dataset.mapRows) * this.gridSize;
    this.zoom = zoom;
    this.minZoom = 0.55;
    this.maxZoom = 4;

    this.drawOrder = [LAYERS.TERRAIN.id, LAYERS.VEGETATION.id, LAYERS.RIVER.id,
      LAYERS.INFRASTRUCTURE.id, LAYERS.SETTLEMENT.id, LAYERS.RESOURCE.id, LAYERS.CLAN.id, "text"];

    this.grid = {};
    this.baseLayerImages = new Map();
    this.settlementLanguage = "english";

    this.settlementImages = {};
    this.tintedIconCache = {};
  }

  // Repaint the whole canvas. Subclasses implement this (draw / render).
  redraw() {}

  isLayerVisible(_layerName) { return true; }

  /**
   * @returns {Promise<void>} Completes when all base-layer images are loaded.
   */
  async loadBaseLayerImages() {
    this.baseLayersLoading = true;
    try {
      const entries = await Promise.all(BASE_LAYER_IMAGES.map(({ image }) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve([image, img]);
        img.onerror = () => reject(new Error(`Failed to load base-layer image: ${image}`));
        img.src = image;
      })));
      this.baseLayerImages = new Map(entries);
    } catch (err) {
      console.error("Failed to load base-layer images:", err);
      throw err;
    } finally {
      this.baseLayersLoading = false;
    }
  }

  getCellKey(x, y) {
    return x + "," + y;
  }

  getGridCell(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mapX = (event.clientX - rect.left) / this.zoom;
    const mapY = (event.clientY - rect.top) / this.zoom;
    return { x: Math.floor(mapX / this.gridSize), y: Math.floor(mapY / this.gridSize) };
  }

  setSettlementLanguage(language) {
    if (!["english", "rokugani"].includes(language)) return;
    this.settlementLanguage = language;
    this.redraw();
  }

  /**
   * @param {unknown} grid Parsed numeric map data.
   * @returns {void}
   */
  validateGridData(grid) {
    if (!grid || typeof grid !== "object" || Array.isArray(grid)) {
      throw new TypeError("Map data must be an object of cells.");
    }
    Object.entries(grid).forEach(([key, cell]) => {
      if (!cell || typeof cell !== "object" || Array.isArray(cell)) {
        throw new TypeError(`Map cell ${key} must be an object.`);
      }
      Object.values(LAYERS).forEach((layer) => {
        if (Object.hasOwn(cell, layer.id) && !layer.getValue(cell[layer.id])) {
          throw new TypeError(`Invalid ${layer.id} value in map cell ${key}: ${cell[layer.id]}`);
        }
      });
    });
  }

  setZoom(zoom) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    this.applyZoom();
  }

  zoomIn() { this.setZoom(this.zoom * 1.25); }
  zoomOut() { this.setZoom(this.zoom / 1.25); }
  resetZoom() { this.setZoom(1); }

  fitToWidth() {
    const available = this.canvas.parentElement.clientWidth;
    if (available && this.mapWidth) this.setZoom(available / this.mapWidth);
  }

  applyZoom() {
    if (!this.mapWidth) return;
    this.canvas.width = Math.round(this.mapWidth * this.zoom);
    this.canvas.height = Math.round(this.mapHeight * this.zoom);
    this.redraw();
    const label = document.getElementById("zoomLevel");
    if (label) label.textContent = Math.round(this.zoom * 100) + "%";
  }

  drawBaseTiles() {
    if (this.baseLayersLoading) return;
    for (const [key, cell] of Object.entries(this.grid)) {
      const [x, y] = key.split(",").map(Number);
      const terrain = LAYERS.TERRAIN.getValue(cell.terrain ?? TERRAIN.FLAT.id);
      const climate = LAYERS.CLIMATE.getValue(cell.climate ?? CLIMATE.TEMPERATE.id);
      const vegetation = this.isLayerVisible(LAYERS.VEGETATION.id)
        ? LAYERS.VEGETATION.getValue(cell.vegetation ?? VEGETATION.NONE.id) : VEGETATION.NONE;
      drawBaseLayers(this.ctx, x, y, this.gridSize, terrain, climate, vegetation, this.baseLayerImages);
    }
  }

  drawCliffEdges() {
    for (const [key, cell] of Object.entries(this.grid)) {
      const [x, y] = key.split(",").map(Number);
      drawCliffEdges(this.ctx, x, y, this.gridSize, this.zoom, cell["cliff direction"]);
    }
  }

  drawRiverLayer() {
    const riverStripeColors = ["#F4A460", "#ADD8E6", "#0000FF", "#ADD8E6", "#F4A460"];
    const riverStripeOffsets = [-2, -1, 0, 1, 2];

    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.river) continue;
      const [x, y] = key.split(",").map(Number);
      const item = LAYERS.RIVER.getValue(cell.river);
      if (!item || item.id === 0) continue;

      const cx = x * this.gridSize + this.gridSize / 2;
      const cy = y * this.gridSize + this.gridSize / 2;
      const ctx = this.ctx;

      ctx.save();
      ctx.lineCap = "round";
      const stripeWidth = Math.max(1.25, 4 * 0.45);
      const stripeSpacing = stripeWidth * 0.85;

      const allNeighbors = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const connected = allNeighbors.some(([dx, dy]) => {
        const neighborCell = this.grid[this.getCellKey(x + dx, y + dy)];
        return neighborCell && neighborCell.river;
      });

      const forwardNeighbors = [[1, 0], [0, 1]];
      for (const [dx, dy] of forwardNeighbors) {
        const neighborCell = this.grid[this.getCellKey(x + dx, y + dy)];
        if (neighborCell && neighborCell.river) {
          const nx = -dy;
          const ny = dx;
          riverStripeColors.forEach((color, index) => {
            const offset = riverStripeOffsets[index] * stripeSpacing;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = stripeWidth;
            ctx.moveTo(cx + nx * offset, cy + ny * offset);
            ctx.lineTo(
              cx + dx * this.gridSize + nx * offset,
              cy + dy * this.gridSize + ny * offset
            );
            ctx.stroke();
          });
        }
      }

      if (!connected) {
        const halfLength = this.gridSize * 0.25;
        [[1, 0], [0, 1]].forEach(([dx, dy]) => {
          const nx = -dy;
          const ny = dx;
          riverStripeColors.forEach((color, index) => {
            const offset = riverStripeOffsets[index] * stripeSpacing;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = stripeWidth;
            ctx.moveTo(
              cx - dx * halfLength + nx * offset,
              cy - dy * halfLength + ny * offset
            );
            ctx.lineTo(
              cx + dx * halfLength + nx * offset,
              cy + dy * halfLength + ny * offset
            );
            ctx.stroke();
          });
        });
      }

      ctx.restore();
    }
  }

  drawInfrastructureLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.infrastructure) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawInfrastructure(x, y, cell.infrastructure);
    }
  }

  drawInfrastructure(x, y, infraVal) {
    const item = getInfrastructureStyle(LAYERS.INFRASTRUCTURE.getValue(infraVal));
    if (!item) return;

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    const ctx = this.ctx;

    if (item.marker) {
      ctx.save();
      ctx.fillStyle = item.color || "#5C3A1E";
      ctx.font = "bold " + (this.gridSize * 0.625) + "px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(item.marker, x * this.gridSize + 1, y * this.gridSize + 1);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.strokeStyle = item.color || "#5C3A1E";
    ctx.lineWidth = item.lineWidth || 2;
    ctx.lineCap = "round";

    const forward = [[1, 0], [0, 1], [1, 1], [1, -1]];
    forward.forEach(([dx, dy]) => {
      const neighbourCell = this.grid[this.getCellKey(x + dx, y + dy)];
      if (!neighbourCell || !neighbourCell.infrastructure) return;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
      ctx.stroke();
    });

    ctx.restore();
  }

  traceClanPolygons(cellSet) {
    const size = this.gridSize;
    const edges = new Map();
    const addEdge = (a, b) => {
      if (!edges.has(a)) edges.set(a, []);
      edges.get(a).push(b);
    };
    const has = (cx, cy) => cellSet.has(cx + "," + cy);

    for (const key of cellSet) {
      const [cx, cy] = key.split(",").map(Number);
      if (!has(cx, cy - 1)) addEdge(cx + "," + cy, (cx + 1) + "," + cy);
      if (!has(cx + 1, cy)) addEdge((cx + 1) + "," + cy, (cx + 1) + "," + (cy + 1));
      if (!has(cx, cy + 1)) addEdge((cx + 1) + "," + (cy + 1), cx + "," + (cy + 1));
      if (!has(cx - 1, cy)) addEdge(cx + "," + (cy + 1), cx + "," + cy);
    }

    const polygons = [];
    while (edges.size) {
      const start = edges.keys().next().value;
      const polygon = [start];
      let current = start;
      while (true) {
        const nexts = edges.get(current);
        const next = nexts.pop();
        if (!nexts.length) edges.delete(current);
        polygon.push(next);
        if (next === start) break;
        current = next;
      }
      polygons.push(polygon.map((v) => v.split(",").map((n) => Number(n) * size)));
    }
    return polygons;
  }

  clanCellGroups() {
    const cellsByClan = {};
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.clan) continue;
      const clan = LAYERS.CLAN.getValue(cell.clan);
      if (clan && clan !== CLAN.NONE) (cellsByClan[clan.id] ||= new Set()).add(key);
    }
    return cellsByClan;
  }

  drawSettlementsLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.settlement) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawSettlementMarker(x, y, cell);
    }
  }

  drawResourcesLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.resource) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawResourceMarker(x, y, cell.resource);
    }
  }

  drawSettlementMarker(x, y, cell) {
    const { settlement: setVal } = cell;
    const setItem = LAYERS.SETTLEMENT.getValue(setVal);
    const typeName = setItem.name;

    const size = this.gridSize;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;

    const clan = LAYERS.CLAN.getValue(cell.clan ?? CLAN.NONE.id);
    const clanColors = clan === CLAN.NONE ? NEUTRAL_SETTLEMENT_COLORS : getClanColors(clan);

    const fillColor = clanColors.fill || "#DDDDDD";
    const borderColor = clanColors.border || "#444444";

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 / this.zoom;

    if (typeName === "Village" || typeName === "City" || typeName === "Capital") {
      ctx.beginPath();
      ctx.arc(cx, cy, typeName === "Village" ? 3 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (typeName === "Capital") {
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (typeName === "Village Ruins") {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4);
      ctx.lineTo(cx + 4, cy - 4);
      ctx.stroke();
    } else if (typeName === "Fortification" || typeName === "Castle" || typeName === "Kyuden") {
      const side = typeName === "Fortification" ? 6 : 10;
      ctx.fillRect(cx - side / 2, cy - side / 2, side, side);
      ctx.strokeRect(cx - side / 2, cy - side / 2, side, side);
      if (typeName === "Kyuden") {
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (typeName === "Castle Ruins" || typeName === "Academy") {
      const side = 10;
      ctx.fillRect(cx - side / 2, cy - side / 2, side, side);
      ctx.strokeRect(cx - side / 2, cy - side / 2, side, side);
      if (typeName === "Castle Ruins") {
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 5);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.stroke();
      } else {
        ctx.fillStyle = borderColor;
        ctx.font = `${6 / this.zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("A", cx, cy);
      }
    } else if (typeName === "Watchtower") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx + 4, cy - 1);
      ctx.lineTo(cx - 4, cy - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(cx - 2.5, cy - 1, 5, 6);
      ctx.strokeRect(cx - 2.5, cy - 1, 5, 6);
    } else if (typeName === "Small Shrine" || typeName === "Large Shrine") {
      this.drawShrine(cx, cy, borderColor, getSettlementAsset(setItem), typeName === "Small Shrine" ? 0.75 : 1);
    } else if (typeName === "Small Temple" || typeName === "Large Temple") {
      this.drawTemple(cx, cy, borderColor, getSettlementAsset(setItem), typeName === "Small Temple" ? 12 : 16);
    }
    ctx.restore();
  }

  drawResourceMarker(x, y, resourceVal) {
    const item = LAYERS.RESOURCE.getValue(resourceVal);
    const image = getResourceImage(item);
    if (!image) return;

    const size = this.gridSize;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;
    const img = this.settlementImage(image);
    if (img.complete && img.naturalWidth) this.ctx.drawImage(img, cx - 6, cy - 6, 12, 12);
  }

  drawSettlementText(x, y, cell) {
    const { settlement: setVal, englishName = "", rokuganiName = "" } = cell;
    const setItem = LAYERS.SETTLEMENT.getValue(setVal);

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    const name = this.settlementLanguage === "english" ? englishName : rokuganiName;
    const label = this.settlementLanguage === "english" ? setItem.englishType : setItem.rokuganiType;
    this.drawSettlementLabel(cx, cy, label, name, getSettlementLabelSize(setItem));
  }

  drawResourceText(x, y, resourceVal) {
    const item = LAYERS.RESOURCE.getValue(resourceVal);
    if (!item) return;

    const label = item.name;
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    this.drawMapText(label, cx, cy + this.gridSize / 2 + 3, 6);
  }

  settlementImage(src) {
    let img = this.settlementImages[src];
    if (!img) {
      img = new Image();
      img.onload = () => this.redraw();
      img.onerror = () => console.error(`Failed to load map marker image: ${src}`);
      img.src = src;
      this.settlementImages[src] = img;
    }
    return img;
  }

  drawShrine(cx, cy, color, imageSource, scale) {
    const source = this.settlementImage(imageSource);
    if (!source.complete || !source.naturalWidth) return;
    const width = Math.round(source.naturalWidth * scale);
    const height = Math.round(source.naturalHeight * scale);
    const image = this.tintedMapIcon(source, color, width, height);
    this.ctx.drawImage(image, cx - image.width / 2, cy - image.height / 2);
  }

  drawTemple(cx, cy, color, imageSource, size) {
    const source = this.settlementImage(imageSource);
    if (!source.complete || !source.naturalWidth) return;
    const image = this.tintedMapIcon(source, color, size, size);
    this.ctx.drawImage(image, cx - image.width / 2, cy - image.height / 2);
  }

  tintedMapIcon(source, color, width, height) {
    const key = [source.src, color, width, height].join(":");
    if (this.tintedIconCache[key]) return this.tintedIconCache[key];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.tintedIconCache[key] = canvas;
    return canvas;
  }

  drawSettlementLabel(cx, cy, label, name, fontSize) {
    if (!name) return;
    this.drawMapText(name, cx, cy + this.gridSize / 2 + fontSize / 2, fontSize);
    if (label) this.drawMapText(label, cx, cy + this.gridSize / 2 + fontSize * 1.5, fontSize);
  }

  drawTextLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      const [x, y] = key.split(",").map(Number);
      if (cell.text) this.drawText(x, y, this.textContent(cell.text), cell.text.fontSize || 14);
      if (cell.settlement) this.drawSettlementText(x, y, cell);
    }
  }

  textContent(data) {
    if (typeof data === "string") return data;
    return this.settlementLanguage === "english"
      ? data.englishText || data.text || data.rokuganiText || ""
      : data.rokuganiText || data.text || data.englishText || "";
  }

  drawMapText(text, x, y, fontSize) {
    if (!text) return;
    const lines = String(text).split(/\r?\n/);
    const lineHeight = fontSize;
    const firstLineY = y - (lines.length - 1) * lineHeight / 2;
    this.ctx.font = "bold " + fontSize + "px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = Math.max(2, fontSize / 6);
    this.ctx.fillStyle = "#000000";
    lines.forEach((line, index) => {
      const lineY = firstLineY + index * lineHeight;
      this.ctx.strokeText(line, x, lineY);
      this.ctx.fillText(line, x, lineY);
    });
  }

  drawText(x, y, text, fontSize) {
    if (!text) return;
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    this.ctx.font = "bold " + fontSize + "px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = Math.max(2, fontSize / 6);
    this.ctx.strokeText(text, cx, cy);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillText(text, cx, cy);
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1 / this.zoom;

    for (let x = 0; x <= this.mapWidth; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.mapHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= this.mapHeight; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.mapWidth, y);
      ctx.stroke();
    }
  }

  drawOverlayLayer(layerName) {
    this.drawOverlayLayers([layerName]);
  }

  overlayColor(layerName, val) {
    const layer = Object.values(LAYERS).find((definition) => definition.id === layerName);
    const getColor = OVERLAY_COLORS.get(layer);
    if (!getColor) throw new TypeError(`Unknown overlay layer: ${layerName}`);
    return getColor(layer.getValue(val ?? 0));
  }

  drawOverlayLayers(layerNames) {
    if (!layerNames || !layerNames.length) return;
    for (const [key, cell] of Object.entries(this.grid)) {
      const overlays = [];
      for (const layerName of layerNames) {
        const val = cell[layerName];
        const color = this.overlayColor(layerName, val);
        if (color) overlays.push({ layerName, color });
      }
      if (!overlays.length) continue;
      const [x, y] = key.split(",").map(Number);
      if (overlays.length === 1) {
        this.fillCell(x, y, overlays[0].color, 1.0);
        this.drawOverlayCueSegment(x, y, overlays[0].layerName, overlays[0].color, 0, 1);
        continue;
      }

      // When several optional overlays are enabled on the viewer at once, split
      // the tile into equal vertical bands so each enabled overlay remains
      // visible without blending its color with the others.
      const stripeWidth = 1 / overlays.length;
      for (let index = 0; index < overlays.length; index++) {
        this.fillCellSegment(x, y, overlays[index].color, index * stripeWidth, stripeWidth, 1.0);
        this.drawOverlayCueSegment(x, y, overlays[index].layerName, overlays[index].color, index * stripeWidth, stripeWidth);
      }
    }
  }

  fillCell(x, y, color, alpha = 0.8) {
    if (!color) return;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    this.ctx.restore();
  }

  fillCellSegment(x, y, color, startRatio, widthRatio, alpha = 0.8) {
    if (!color || widthRatio <= 0) return;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.gridSize + this.gridSize * startRatio,
      y * this.gridSize,
      this.gridSize * widthRatio,
      this.gridSize
    );
    this.ctx.restore();
  }

  drawOverlayCueSegment(x, y, layerName, color, startRatio, widthRatio) {
    if (widthRatio <= 0) return;
    const left = x * this.gridSize + this.gridSize * startRatio;
    const top = y * this.gridSize;
    const width = this.gridSize * widthRatio;
    const height = this.gridSize;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const inset = Math.max(0.75, Math.min(width, height) * 0.2);
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    const cueColor = this.overlayCueColor(color);
    ctx.strokeStyle = cueColor;
    ctx.fillStyle = cueColor;
    ctx.lineWidth = Math.max(1, 1 / this.zoom);
    ctx.lineCap = "round";

    if (layerName === "animal") {
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(1, Math.min(width, height) * 0.18), 0, Math.PI * 2);
      ctx.fill();
    } else if (layerName === "spirit") {
      ctx.beginPath();
      ctx.moveTo(centerX, top + inset);
      ctx.lineTo(centerX, top + height - inset);
      ctx.stroke();
    } else if (layerName === "shadowland") {
      ctx.beginPath();
      ctx.moveTo(left + inset, top + inset);
      ctx.lineTo(left + width - inset, top + height - inset);
      ctx.stroke();
    } else if (layerName === "crime") {
      ctx.beginPath();
      ctx.moveTo(left + inset, centerY);
      ctx.lineTo(left + width - inset, centerY);
      ctx.stroke();
    } else if (layerName === "resourceLevel") {
      ctx.beginPath();
      ctx.moveTo(centerX, top + inset);
      ctx.lineTo(centerX, top + height - inset);
      ctx.moveTo(left + inset, centerY);
      ctx.lineTo(left + width - inset, centerY);
      ctx.stroke();
    }

    ctx.restore();
  }

  overlayCueColor(color) {
    const rgbaMatch = color && color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbaMatch) {
      const [r, g, b] = rgbaMatch[1].split(",").slice(0, 3).map((part) => Number.parseFloat(part.trim()) || 0);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance < 140 ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)";
    }

    const hexMatch = color && color.match(/^#([0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance < 140 ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)";
    }

    return "rgba(0, 0, 0, 0.85)";
  }
}
