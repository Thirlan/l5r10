import { WorldMapRenderer } from "./world-map-common.js";
import { isInsideMap, readMapFile, stringifyMapFile } from "../data/world-map-data-file.js";
import { LAYERS, TERRAIN } from "../data/world-map-data-layers.js";
import { getElevation } from "../data/world-map-data-elevation.js";
import { getClanColors } from "../data/clan-colors.js";
import { DEFAULT_ELEVATION } from "../data/world-map-data.config.js";
import { BUILDER_START_ZOOM, GRID_SIZE } from "./world-map-draw.config.js";

export class WorldMapGrid extends WorldMapRenderer {
  constructor(canvasSelector, gridSize = GRID_SIZE) {
    super(canvasSelector, gridSize, { zoom: BUILDER_START_ZOOM });

    this.currentLayer = LAYERS.TERRAIN.id;
    this.currentValue = TERRAIN.FLAT.id;
    this.fontSize = 14;
    this.brushSize = 1;
    this.isDrawing = false;
    this.elevationOperation = "set";
    this.strokeCells = new Set();
    this.riverDirections = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    this.setupEventListeners();
    this.ready = this.initialize();
    this.applyZoom();
  }

  redraw() {
    this.draw();
  }

  /**
   * @returns {Promise<void>} Completes after map assets and data load.
   */
  async initialize() {
    try {
      await this.loadBaseLayerImages();

      const dataUrl = this.canvas.dataset.mapData;
      if (dataUrl) {
        await this.loadMapFromUrl(dataUrl);
      }

      this.draw();
    } catch (err) {
      console.error("Failed to initialize map builder:", err);
      throw err;
    }
  }

  async loadMapFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load map JSON: HTTP " + res.status);
      const text = await res.text();
      if (!this.loadFromJSON(text)) throw new Error("Invalid map data from URL: " + url);
    } catch (e) {
      console.error("Failed to load map data from URL:", e);
      throw e;
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      this.strokeCells.clear();
      this.isDrawing = true;
      this.paintAt(e);
    });
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDrawing) this.paintAt(e);
    });
    this.canvas.addEventListener("mouseup", () => (this.isDrawing = false));
    this.canvas.addEventListener("mouseleave", () => (this.isDrawing = false));
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const cell = this.getGridCell(e);
      this.clearCell(cell.x, cell.y);
    });
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
      },
      { passive: false },
    );
  }

  ensureCell(key) {
    if (!this.grid[key]) {
      this.grid[key] = {};
    }
    return this.grid[key];
  }

  paintAt(event) {
    if (!this.currentLayer) return;
    if (this.currentLayer === "river" && this.currentValue && !Object.values(this.riverDirections).some((direction) => direction === 1)) return;
    const { x, y } = this.getGridCell(event);
    if (!isInsideMap(this.mapHeader, x, y)) return;

    const key = this.getCellKey(x, y);

    if (this.currentLayer === "text") {
      const textEntry = this.createTextEntry();
      if (textEntry.englishText || textEntry.rokuganiText) {
        const cell = this.ensureCell(key);
        cell.text = textEntry;
      }
      this.draw();
      return;
    }

    if (this.currentLayer === LAYERS.ELEVATION.id) {
      this.paintElevation(x, y);
      this.draw();
      return;
    }

    this.brushCells(x, y).forEach(([cx, cy]) => {
      const cellKey = this.getCellKey(cx, cy);

      if (this.currentLayer === "erase") {
        if (!this.grid[cellKey]) return;
        if (!this.currentValue) {
          delete this.grid[cellKey];
        } else {
          const layerToErase = this.currentValue;
          const cell = this.grid[cellKey];
          if (["terrain", "elevation", "climate", "vegetation", "river", "animal", "spirit", "shadowland", "crime", "resourceLevel"].includes(layerToErase)) {
            delete cell[layerToErase];
            if (layerToErase === "river") delete cell["river direction"];
          } else if (layerToErase === "infrastructure") {
            delete cell.infrastructure;
          } else if (layerToErase === "resource") {
            delete cell.resource;
          } else if (layerToErase === "clan") {
            delete cell.clan;
          } else if (layerToErase === "settlement") {
            delete cell.settlement;
            delete cell.englishName;
            delete cell.rokuganiName;
          } else if (layerToErase === "text") {
            delete cell.text;
          }
        }
      } else {
        const cell = this.ensureCell(cellKey);
        const valId = this.currentValue;

        if (["terrain", "climate", "vegetation", "river", "animal", "spirit", "shadowland", "crime", "resourceLevel"].includes(this.currentLayer)) {
          if (valId || this.currentLayer === LAYERS.TERRAIN.id || this.currentLayer === LAYERS.CLIMATE.id) {
            cell[this.currentLayer] = valId;
          } else delete cell[this.currentLayer];
          if (this.currentLayer === "river") {
            if (valId) cell["river direction"] = { ...this.riverDirections };
            else delete cell["river direction"];
          }
        } else if (this.currentLayer === "infrastructure") {
          cell.infrastructure = valId;
        } else if (this.currentLayer === "resource") {
          cell.resource = valId;
        } else if (this.currentLayer === "clan") {
          cell.clan = valId;
        } else if (this.currentLayer === "settlement") {
          cell.settlement = valId;
          const setObj = this.createSettlement(valId);
          if (setObj.englishName) cell.englishName = setObj.englishName;
          if (setObj.rokuganiName) cell.rokuganiName = setObj.rokuganiName;
        }
      }
    });

    this.draw();
  }

  /**
   * @param {number} x Brush column.
   * @param {number} y Brush row.
   * @returns {void}
   */
  paintElevation(x, y) {
    const delta = this.elevationOperation === "delta";
    const keys = this.brushCells(x, y).map(([column, row]) => this.getCellKey(column, row));
    const changes = keys
      .filter((key) => !delta || !this.isDrawing || !this.strokeCells.has(key))
      .map((key) => {
        const elevation = delta ? getElevation(this.grid[key] ?? {}) + this.currentValue : this.currentValue;
        return [key, elevation];
      });
    if (changes.some(([, elevation]) => !Number.isSafeInteger(elevation))) {
      alert("Elevation must stay within the safe integer range. No tiles in this brush were changed.");
      return;
    }
    changes.forEach(([key, elevation]) => {
      const cell = this.ensureCell(key);
      if (elevation === DEFAULT_ELEVATION) delete cell.elevation;
      else cell.elevation = elevation;
      if (delta && this.isDrawing) this.strokeCells.add(key);
    });
  }

  brushCells(x, y) {
    const offset = Math.floor((this.brushSize - 1) / 2);
    const cells = [];
    for (let dy = 0; dy < this.brushSize; dy++) {
      for (let dx = 0; dx < this.brushSize; dx++) {
        const cx = x - offset + dx;
        const cy = y - offset + dy;
        if (isInsideMap(this.mapHeader, cx, cy)) cells.push([cx, cy]);
      }
    }
    return cells;
  }

  setBrushSize(size) {
    this.brushSize = Math.min(8, Math.max(1, Number(size) || 1));
  }

  /**
   * @param {string} layer Canonical layer ID, text, or erase.
   * @param {number|string|null} value Numeric value, erase target, or null for text.
   * @param {string} [toolLayer] Matching layer ID.
   * @param {string} [operation="set"] Elevation operation: set or delta.
   * @returns {void}
   */
  selectTool(layer, value, toolLayer, operation = "set") {
    if (toolLayer && toolLayer !== layer) throw new TypeError("Tool layer must match the selected layer.");
    if (!["set", "delta"].includes(operation)) throw new TypeError("Elevation operation must be set or delta.");
    if (layer === "erase") {
      if (value !== null && value !== "text" && !Object.values(LAYERS).some((definition) => definition.id === value)) {
        throw new TypeError(`Unknown erase layer: ${value}`);
      }
    } else if (layer === "text") {
      if (value !== null) throw new TypeError("Text tools do not have a layer value.");
    } else {
      const definition = Object.values(LAYERS).find((definition) => definition.id === layer);
      if (!definition?.getValue(value)) throw new TypeError(`Invalid tool selection: ${layer}=${value}`);
    }
    this.currentValue = value;
    this.currentLayer = toolLayer || layer;
    this.elevationOperation = operation;
    this.draw();
  }

  setRiverDirection(direction, enabled) {
    if (Object.hasOwn(this.riverDirections, direction)) {
      this.riverDirections[direction] = enabled ? 1 : 0;
    }
  }

  setFontSize(size) {
    this.fontSize = Number(size);
  }

  createSettlement(type) {
    const engInput = document.getElementById("settlementEnglishName");
    const rokInput = document.getElementById("settlementRokuganiName");
    return {
      type,
      englishName: engInput ? engInput.value.trim() : "",
      rokuganiName: rokInput ? rokInput.value.trim() : "",
    };
  }

  createTextEntry() {
    const engInput = document.getElementById("textEnglish");
    const rokInput = document.getElementById("textRokugani");
    return {
      englishText: engInput ? engInput.value.trim() : "",
      rokuganiText: rokInput ? rokInput.value.trim() : "",
      fontSize: Number(this.fontSize),
    };
  }

  clearCell(x, y) {
    const key = this.getCellKey(x, y);
    delete this.grid[key];
    this.draw();
  }

  draw() {
    if (!this.mapWidth) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.zoom, this.zoom);

    this.drawBaseTiles();

    // Render remaining layers
    for (const layerName of this.drawOrder) {
      if (layerName === "river") this.drawRiverLayer();
      else if (layerName === "infrastructure") this.drawInfrastructureLayer();
      else if (layerName === "settlement") this.drawSettlementsLayer();
      else if (layerName === "resource") this.drawResourcesLayer();
      else if (layerName === "clan") this.drawClanBoundariesLayer();
    }

    const activeOverlay = this.getActiveOverlayLayer();
    if (activeOverlay) {
      this.drawOverlayLayer(activeOverlay);
    }

    this.drawCliffEdges();
    this.drawGrid();
    if (this.drawOrder.includes("text")) this.drawTextLayer();
    this.updateRiverFlow();
  }

  drawClanBoundariesLayer() {
    const cellsByClan = this.clanCellGroups();
    const size = this.gridSize;

    for (const [clan, cells] of Object.entries(cellsByClan)) {
      const colors = getClanColors(LAYERS.CLAN.getValue(Number(clan)));

      const polygons = this.traceClanPolygons(cells);
      if (!polygons.length) continue;

      this.ctx.save();
      this.ctx.lineJoin = "miter";
      this.ctx.lineCap = "square";

      const clip = new Path2D();
      for (const key of cells) {
        const [cx, cy] = key.split(",").map(Number);
        clip.rect(cx * size, cy * size, size, size);
      }
      this.ctx.clip(clip);

      const strokePath = new Path2D();
      for (const poly of polygons) {
        strokePath.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) strokePath.lineTo(poly[i][0], poly[i][1]);
        strokePath.closePath();
      }

      this.ctx.strokeStyle = colors.border;
      this.ctx.lineWidth = 12 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.strokeStyle = colors.fill;
      this.ctx.lineWidth = 6 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.strokeStyle = "#444444";
      this.ctx.lineWidth = 2 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.restore();
    }
  }

  getActiveOverlayLayer() {
    const overlayLayers = ["elevation", "animal", "spirit", "shadowland", "crime", "resourceLevel"];
    if (overlayLayers.includes(this.currentLayer)) {
      return this.currentLayer;
    }
    if (this.currentLayer === "erase" && overlayLayers.includes(this.currentValue)) {
      return this.currentValue;
    }
    return null;
  }

  /**
   * @param {Date} [now] Date for lastUpdated in the header.
   * @returns {string} Text of the map file: the header, then the tiles.
   */
  saveToJSON(now = new Date()) {
    return stringifyMapFile(this.mapHeader, this.grid, now);
  }

  loadFromJSON(jsonString) {
    try {
      this.loadMapFile(readMapFile(JSON.parse(jsonString)));
      this.applyZoom();
      return true;
    } catch (e) {
      console.error("Failed to load JSON:", e);
      return false;
    }
  }

  exportToFile() {
    const blob = new Blob([this.saveToJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "world-map-grid.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!this.loadFromJSON(e.target.result)) {
        alert("Failed to load map. Please check the file format.");
      }
    };
    reader.readAsText(file);
  }

  clearAllLayers() {
    if (confirm("Are you sure you want to clear all layers?")) {
      this.grid = {};
      this.draw();
    }
  }
}
