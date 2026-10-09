import { WorldMapRenderer } from "./world-map-common.js";
import { LAYERS, TERRAIN } from "./world-map-layers.js";
import { getClanColors } from "./clan-colors.js";

const DEFAULT_GRID_SIZE = 16;

export class WorldMapGrid extends WorldMapRenderer {
  constructor(canvasSelector, gridSize = DEFAULT_GRID_SIZE) {
    super(canvasSelector, gridSize, { zoom: 0.35 });

    this.currentLayer = LAYERS.TERRAIN.id;
    this.currentValue = TERRAIN.FLAT.id;
    this.fontSize = 14;
    this.brushSize = 1;
    this.isDrawing = false;
    this.cliffDirections = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    this.setupEventListeners();
    this.ready = this.initialize();
    this.applyZoom();
  }

  redraw() { this.draw(); }

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
      this.isDrawing = true;
      this.paintAt(e);
    });
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDrawing) this.paintAt(e);
    });
    this.canvas.addEventListener("mouseup", () => this.isDrawing = false);
    this.canvas.addEventListener("mouseleave", () => this.isDrawing = false);
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const cell = this.getGridCell(e);
      this.clearCell(cell.x, cell.y);
    });
    this.canvas.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
  }

  ensureCell(key) {
    if (!this.grid[key]) {
      this.grid[key] = {};
    }
    return this.grid[key];
  }

  paintAt(event) {
    if (!this.currentLayer) return;
    const cliffId = TERRAIN.CLIFF.id;
    const paintingCliffTerrain = this.currentLayer === LAYERS.TERRAIN.id && this.currentValue === cliffId;
    if (paintingCliffTerrain && !Object.values(this.cliffDirections).some((direction) => direction === 1)) return;
    const { x, y } = this.getGridCell(event);
    if (x < 0 || y < 0) return;

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

    this.brushCells(x, y).forEach(([cx, cy]) => {
      const cellKey = this.getCellKey(cx, cy);

      if (this.currentLayer === "erase") {
        if (!this.grid[cellKey]) return;
        if (!this.currentValue) {
          delete this.grid[cellKey];
        } else {
          const layerToErase = this.currentValue;
          const cell = this.grid[cellKey];
          if (["terrain", "climate", "vegetation", "river", "animal", "spirit", "shadowland", "crime", "resourceLevel"].includes(layerToErase)) {
            delete cell[layerToErase];
            if (layerToErase === "terrain") delete cell["cliff direction"];
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
          if (this.currentLayer === "terrain") {
            if (valId === cliffId) {
              if (Object.values(this.cliffDirections).some((direction) => direction === 1)) {
                cell["cliff direction"] = { ...this.cliffDirections };
              } else {
                delete cell["cliff direction"];
              }
            } else {
              delete cell["cliff direction"];
            }
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

  brushCells(x, y) {
    const offset = Math.floor((this.brushSize - 1) / 2);
    const cells = [];
    for (let dy = 0; dy < this.brushSize; dy++) {
      for (let dx = 0; dx < this.brushSize; dx++) {
        const cx = x - offset + dx;
        const cy = y - offset + dy;
        if (cx >= 0 && cy >= 0) cells.push([cx, cy]);
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
   * @returns {void}
   */
  selectTool(layer, value, toolLayer) {
    if (toolLayer && toolLayer !== layer) throw new TypeError("Tool layer must match the selected layer.");
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
    this.draw();
  }

  setCliffDirection(direction, enabled) {
    if (direction === "all") {
      for (const index of Object.keys(this.cliffDirections)) {
        this.cliffDirections[index] = enabled ? 1 : 0;
      }
      document.querySelectorAll(".cliff-direction-grid input:not(#cliffDirectionAll)").forEach((checkbox) => {
        checkbox.checked = enabled;
      });
    } else if (Object.hasOwn(this.cliffDirections, direction)) {
      this.cliffDirections[direction] = enabled ? 1 : 0;
    } else {
      return;
    }

    const allDirections = Object.values(this.cliffDirections).every((value) => value === 1);
    const allCheckbox = document.getElementById("cliffDirectionAll");
    if (allCheckbox) allCheckbox.checked = allDirections;
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
      rokuganiName: rokInput ? rokInput.value.trim() : ""
    };
  }

  createTextEntry() {
    const engInput = document.getElementById("textEnglish");
    const rokInput = document.getElementById("textRokugani");
    return {
      englishText: engInput ? engInput.value.trim() : "",
      rokuganiText: rokInput ? rokInput.value.trim() : "",
      fontSize: Number(this.fontSize)
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
    this.drawCliffEdges();

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

    this.drawGrid();
    if (this.drawOrder.includes("text")) this.drawTextLayer();
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

      this.ctx.strokeStyle = colors.border || "#00008B";
      this.ctx.lineWidth = 12 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.strokeStyle = colors.fill || "#FFFFFF";
      this.ctx.lineWidth = 6 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.strokeStyle = "#444444";
      this.ctx.lineWidth = 2 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.restore();
    }
  }

  getActiveOverlayLayer() {
    const overlayLayers = ["animal", "spirit", "shadowland", "crime", "resourceLevel"];
    if (overlayLayers.includes(this.currentLayer)) {
      return this.currentLayer;
    }
    if (this.currentLayer === "erase" && overlayLayers.includes(this.currentValue)) {
      return this.currentValue;
    }
    return null;
  }

  saveToJSON() {
    return JSON.stringify(this.grid, null, 2);
  }

  loadFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.validateGridData(parsed);
      this.grid = parsed;
      this.draw();
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
