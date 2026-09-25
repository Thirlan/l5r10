const DEFAULT_GRID_SIZE = 16;

class WorldMapGrid extends WorldMapRenderer {
  constructor(canvasSelector, gridSize = DEFAULT_GRID_SIZE) {
    super(canvasSelector, gridSize, { zoom: 0.35 });

    this.currentLayer = "terrain";
    this.currentValue = null;
    this.fontSize = 14;
    this.brushSize = 1;
    this.isDrawing = false;

    this.setupEventListeners();
    this.loadLayersConfig();
    this.applyZoom();
  }

  redraw() { this.draw(); }

  async loadLayersConfig() {
    try {
      const res = await fetch("../scripts/layers.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      this.layersConfig = await res.json();
      if (this.layersConfig.drawOrder) {
        this.drawOrder = this.layersConfig.drawOrder;
      }
      this.buildLayerMaps();

      await this.loadMapTileImages();

      const dataUrl = this.canvas.dataset.mapData;
      if (dataUrl) {
        await this.loadMapFromUrl(dataUrl);
      }

      this.draw();
    } catch (err) {
      console.error("Failed to load layers.json:", err);
    }
  }

  async loadMapFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const text = await res.text();
      this.loadFromJSON(text);
    } catch (e) {
      console.error("Failed to load map data from URL:", e);
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
      this.grid[key] = { terrain: 0, climate: 0, vegetation: 0, river: 0 };
    }
    return this.grid[key];
  }

  paintAt(event) {
    if (!this.currentLayer) return;
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
          if (["terrain", "climate", "vegetation", "river", "animal", "spirit", "shadowland", "crime", "fertility"].includes(layerToErase)) {
            cell[layerToErase] = 0;
          } else if (layerToErase === "infrastructure") {
            delete cell.infrastructure;
          } else if (layerToErase === "resource" || layerToErase === "resources") {
            delete cell.resource;
          } else if (layerToErase === "clan" || layerToErase === "clans") {
            delete cell.clan;
          } else if (layerToErase === "settlement" || layerToErase === "settlements") {
            delete cell.settlement;
            delete cell.englishName;
            delete cell.rokuganiName;
          } else if (layerToErase === "text") {
            delete cell.text;
          }
        }
      } else {
        const cell = this.ensureCell(cellKey);
        let valId = this.currentValue;

        if (typeof valId === "string" && this.layerMaps[this.currentLayer]) {
          const mapped = this.layerMaps[this.currentLayer].nameToId[valId.toLowerCase()];
          if (mapped !== undefined) valId = mapped;
        }

        if (["terrain", "climate", "vegetation", "river", "animal", "spirit", "shadowland", "crime", "fertility"].includes(this.currentLayer)) {
          cell[this.currentLayer] = valId ?? 0;
        } else if (this.currentLayer === "infrastructure") {
          cell.infrastructure = valId;
        } else if (this.currentLayer === "resource" || this.currentLayer === "resources") {
          cell.resource = valId;
        } else if (this.currentLayer === "clan" || this.currentLayer === "clans") {
          cell.clan = valId;
        } else if (this.currentLayer === "settlement" || this.currentLayer === "settlements") {
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

  selectTool(layer, value, toolLayer) {
    this.currentValue = value;
    this.currentLayer = toolLayer || layer;
    this.draw();
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

    // Render base tile layer (combination of terrain, climate, vegetation)
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

    this.drawGrid();
    if (this.drawOrder.includes("text")) this.drawTextLayer();
  }

  drawClanBoundariesLayer() {
    const cellsByClan = this.clanCellGroups();
    const size = this.gridSize;

    for (const [clan, cells] of Object.entries(cellsByClan)) {
      let colors = null;
      if (this.layerMaps.clan) {
        colors = this.layerMaps.clan.nameToItem[clan.toLowerCase()];
      }
      if (!colors) colors = { border: "#00008B", fill: "#808080" };

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
    const overlayLayers = ["animal", "spirit", "shadowland", "crime", "fertility"];
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
      this.grid = this.normalizeGridData(parsed);
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

let mapGrid;
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("#mapCanvas");
  if (canvas) {
    const gridSize = Number.parseInt(canvas.dataset.gridSize, 10);
    mapGrid = new WorldMapGrid("#mapCanvas", gridSize);
  }
});
