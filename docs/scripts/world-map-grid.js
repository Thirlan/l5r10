const DEFAULT_GRID_SIZE = 16;

class WorldMapGrid {
  constructor(imageSrc, canvasSelector, gridSize = DEFAULT_GRID_SIZE) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext("2d");
    this.gridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : DEFAULT_GRID_SIZE;
    this.zoom = 0.35;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layersConfig = null;
    this.drawOrder = ["terrain", "vegetation", "river", "infrastructure", "resource", "settlement", "clan", "text"];
    this.layerMaps = {};

    this.grid = {}; // Key "x,y" -> { terrain, climate, vegetation, river, resource, infrastructure, clan, settlement, englishName, rokuganiName, text }
    this.tileImageMap = {};

    this.currentLayer = "terrain";
    this.currentValue = null;
    this.fontSize = 16;
    this.settlementLanguage = "english";
    this.brushSize = 1;
    this.isDrawing = false;
    this.shrineIconCache = {};

    this.mapImage = new Image();
    this.mapImage.onload = () => {
      this.mapWidth = this.mapImage.naturalWidth;
      this.mapHeight = this.mapImage.naturalHeight;
      this.applyZoom();
    };
    this.mapImage.src = imageSrc;

    this.farmImage = new Image();
    this.farmImage.onload = () => this.draw();
    this.farmImage.src = "../img/map/farm.png";

    this.mineImage = new Image();
    this.mineImage.onload = () => this.draw();
    this.mineImage.src = "../img/map/mine.png";

    this.shrineImage = new Image();
    this.shrineImage.onload = () => this.draw();
    this.shrineImage.src = "../img/map/shrine.png";

    this.setupEventListeners();
    this.loadLayersConfig();
  }

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

  async loadMapTileImages() {
    try {
      const res = await fetch("../scripts/map_tile_img.json");
      if (!res.ok) return;
      const entries = await res.json();
      for (const entry of entries) {
        const key = entry.terrain + "," + entry.climate + "," + entry.vegetation;
        const img = new Image();
        img.onload = () => this.draw();
        img.src = entry.image;
        this.tileImageMap[key] = img;
      }
    } catch (err) {
      console.error("Failed to load map_tile_img.json:", err);
    }
  }

  buildLayerMaps() {
    if (!this.layersConfig || !this.layersConfig.layers) return;
    for (const [layerKey, layerDef] of Object.entries(this.layersConfig.layers)) {
      const nameToId = {};
      const idToName = {};
      const idToItem = {};
      const nameToItem = {};

      for (const item of layerDef.values) {
        nameToId[item.name] = item.id;
        nameToId[item.name.toLowerCase()] = item.id;
        idToName[item.id] = item.name;
        idToItem[item.id] = item;
        nameToItem[item.name] = item;
        nameToItem[item.name.toLowerCase()] = item;
      }

      this.layerMaps[layerKey] = { nameToId, idToName, idToItem, nameToItem, def: layerDef };
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

  getGridCell(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mapX = (event.clientX - rect.left) / this.zoom;
    const mapY = (event.clientY - rect.top) / this.zoom;
    return { x: Math.floor(mapX / this.gridSize), y: Math.floor(mapY / this.gridSize) };
  }

  getCellKey(x, y) {
    return x + "," + y;
  }

  ensureCell(key) {
    if (!this.grid[key]) {
      this.grid[key] = { terrain: 0, climate: 0, vegetation: 0, river: 0, resource: 0 };
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
          if (["terrain", "climate", "vegetation", "river", "resource", "animal", "spirit", "shadowland", "crime"].includes(layerToErase)) {
            cell[layerToErase] = 0;
          } else if (layerToErase === "infrastructure") {
            delete cell.infrastructure;
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

        if (["terrain", "climate", "vegetation", "river", "resource", "animal", "spirit", "shadowland", "crime"].includes(this.currentLayer)) {
          cell[this.currentLayer] = valId ?? 0;
        } else if (this.currentLayer === "infrastructure") {
          cell.infrastructure = valId;
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

  setSettlementLanguage(language) {
    if (!["english", "rokugani"].includes(language)) return;
    this.settlementLanguage = language;
    this.draw();
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
    this.draw();
    const label = document.getElementById("zoomLevel");
    if (label) label.textContent = Math.round(this.zoom * 100) + "%";
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

    ctx.drawImage(this.mapImage, 0, 0, this.mapWidth, this.mapHeight);

    // Render base tile layer (combination of terrain, climate, vegetation)
    this.drawBaseTiles();

    // Render remaining layers
    for (const layerName of this.drawOrder) {
      if (layerName === "river") this.drawRiverLayer();
      else if (layerName === "infrastructure") this.drawInfrastructureLayer();
      else if (layerName === "resource") this.drawResourceLayer();
      else if (layerName === "settlement") this.drawSettlementsLayer();
      else if (layerName === "clan") this.drawClanBoundariesLayer();
      else if (layerName === "text") this.drawTextLayer();
    }

    const activeOverlay = this.getActiveOverlayLayer();
    if (activeOverlay) {
      this.drawOverlayLayer(activeOverlay);
    }

    this.drawGrid();
  }

  drawBaseTiles() {
    for (const [key, cell] of Object.entries(this.grid)) {
      const [x, y] = key.split(",").map(Number);
      const t = cell.terrain ?? 0;
      const c = cell.climate ?? 0;
      const isWater = (t === 3 || t === 4 || t === 5);
      const v = isWater ? 0 : (cell.vegetation ?? 0);

      const tileKey = t + "," + c + "," + v;
      const img = this.tileImageMap[tileKey];

      if (img && img.complete && img.naturalWidth) {
        this.ctx.drawImage(img, x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
      }
    }
  }

  drawRiverLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.river) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawRiverCell(x, y, cell.river);
    }
  }

  drawRiverCell(x, y, riverId) {
    const map = this.layerMaps.river;
    if (!map) return;
    const item = map.idToItem[riverId];
    if (!item || item.id === 0) return;

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = item.color || "#1E90FF";
    ctx.lineWidth = item.lineWidth || (riverId === 2 ? 4 : 2);
    ctx.lineCap = "round";

    const neighbors = [[1,0], [0,1], [-1,0], [0,-1]];
    let connected = false;
    for (const [dx, dy] of neighbors) {
      const neighborCell = this.grid[this.getCellKey(x + dx, y + dy)];
      if (neighborCell && neighborCell.river) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * (this.gridSize / 2), cy + dy * (this.gridSize / 2));
        ctx.stroke();
        connected = true;
      }
    }

    if (!connected) {
      ctx.beginPath();
      ctx.arc(cx, cy, ctx.lineWidth, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }

    ctx.restore();
  }

  drawResourceLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.resource) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawResourceCell(x, y, cell.resource);
    }
  }

  drawResourceCell(x, y, resourceId) {
    const map = this.layerMaps.resource;
    if (!map) return;
    const item = map.idToItem[resourceId];
    if (!item || item.id === 0) return;

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = item.color || "#FFD700";
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (item.badge) {
      ctx.font = "bold 7px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.fillText(item.badge, cx, cy - 5);
    }
    ctx.restore();
  }

  drawInfrastructureLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.infrastructure) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawInfrastructure(x, y, cell.infrastructure);
    }
  }

  drawInfrastructure(x, y, infraVal) {
    const map = this.layerMaps.infrastructure;
    let item = null;
    if (map) {
      item = typeof infraVal === "number" ? map.idToItem[infraVal] : map.nameToItem[String(infraVal).toLowerCase()];
    }
    if (!item) {
      const styles = {
        Road: { color: "#5C3A1E", lineWidth: 3 },
        Footpath: { color: "#A97443", lineWidth: 1.5 },
        "Small Port": { color: "#D2B48C", marker: "p" },
        "Large Port": { color: "#8B4513", marker: "P" }
      };
      item = styles[infraVal] || styles.Road;
    }

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    const ctx = this.ctx;

    if (item.marker) {
      ctx.save();
      ctx.fillStyle = item.color || "#5C3A1E";
      ctx.font = "bold " + (this.gridSize * 0.75) + "px Arial";
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

  drawClanBoundariesLayer() {
    const cellsByClan = {};
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.clan) continue;
      const clanVal = cell.clan;
      let clanName = clanVal;
      if (typeof clanVal === "number" && this.layerMaps.clan) {
        clanName = this.layerMaps.clan.idToName[clanVal] || clanVal;
      }
      if (clanName && clanName !== "none") {
        (cellsByClan[clanName] ||= new Set()).add(key);
      }
    }

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

  drawSettlementsLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.settlement) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawSettlementMarker(x, y, cell);
    }
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.settlement) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawSettlementText(x, y, cell);
    }
  }

  drawSettlementMarker(x, y, cell) {
    const { settlement: setVal } = cell;
    let typeName = setVal;
    if (typeof setVal === "number" && this.layerMaps.settlement) {
      typeName = this.layerMaps.settlement.idToName[setVal] || setVal;
    }

    const size = this.gridSize;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;

    let clanName = cell.clan;
    if (typeof clanName === "number" && this.layerMaps.clan) {
      clanName = this.layerMaps.clan.idToName[clanName];
    }
    const clanItem = this.layerMaps.clan ? this.layerMaps.clan.nameToItem[String(clanName).toLowerCase()] : null;
    const clanColors = clanItem || { border: "#444444", fill: "#DDDDDD" };

    const neutralColors = { Mine: "#4B4B4B", "Lumber Mill": "#8B5A2B" };
    const isNeutral = typeName in neutralColors;
    const fillColor = neutralColors[typeName] || clanColors.fill || "#DDDDDD";
    const borderColor = isNeutral ? "#222222" : clanColors.border || "#444444";

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
    } else if (typeName === "Mine" && this.mineImage.complete && this.mineImage.naturalWidth) {
      ctx.drawImage(this.mineImage, cx - 6, cy - 6, 12, 12);
    } else if (typeName === "Lumber Mill") {
      for (let row = -1; row <= 1; row++) ctx.fillRect(cx - 5, cy + row * 4 - 1, 10, 2);
    } else if (typeName === "Farm" && this.farmImage.complete && this.farmImage.naturalWidth) {
      ctx.drawImage(this.farmImage, cx - 6, cy - 6, 12, 12);
    } else if (typeName === "Small Shrine" || typeName === "Large Shrine") {
      this.drawShrine(cx, cy, borderColor, typeName === "Small Shrine" ? 0.75 : 1);
    }
    ctx.restore();
  }

  drawSettlementText(x, y, cell) {
    const { settlement: setVal, englishName = "", rokuganiName = "" } = cell;
    let typeName = setVal;
    if (typeof setVal === "number" && this.layerMaps.settlement) {
      typeName = this.layerMaps.settlement.idToName[setVal] || setVal;
    }

    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    const name = this.settlementLanguage === "english" ? englishName : rokuganiName;
    const label = this.settlementLanguage === "english" ? this.englishSettlementType(typeName) : this.rokuganiSettlementType(typeName);
    this.drawSettlementLabel(cx, cy, label, name, this.settlementFontSize(typeName));
  }

  drawShrine(cx, cy, color, scale) {
    if (!this.shrineImage.complete || !this.shrineImage.naturalWidth) return;
    const image = this.shrineIcon(color, scale);
    this.ctx.drawImage(image, cx - image.width / 2, cy - image.height / 2);
  }

  shrineIcon(color, scale) {
    const key = color + ":" + scale;
    if (this.shrineIconCache[key]) return this.shrineIconCache[key];
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(this.shrineImage.naturalWidth * scale);
    canvas.height = Math.round(this.shrineImage.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.shrineImage, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.shrineIconCache[key] = canvas;
    return canvas;
  }

  drawSettlementLabel(cx, cy, label, name, fontSize) {
    if (!name) return;
    this.drawMapText(name, cx, cy + this.gridSize / 2 + fontSize / 2, fontSize);
    if (label) this.drawMapText(label, cx, cy + this.gridSize / 2 + fontSize * 1.5, fontSize);
  }

  settlementFontSize(type) {
    return { Village: 8, City: 10, Capital: 12, Fortification: 8, Castle: 10, Kyuden: 12, Mine: 8, "Lumber Mill": 8, Farm: 8, "Small Shrine": 8, "Large Shrine": 10 }[type] || 8;
  }

  englishSettlementType(type) {
    return type === "Kyuden" ? "Palace" : type;
  }

  rokuganiSettlementType(type) {
    return { Village: "Mura", City: "Toshi", Capital: "Shuto", Fortification: "", Castle: "Shiro", Kyuden: "Kyuden", Mine: "Kōzan", "Lumber Mill": "Seizaijo", Farm: "Nōjō", "Small Shrine": "Shōsha", "Large Shrine": "Taisha" }[type] || type;
  }

  drawTextLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.text) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawText(x, y, this.textContent(cell.text), cell.text.fontSize || 16);
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
    this.ctx.font = "bold " + fontSize + "px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = Math.max(2, fontSize / 6);
    this.ctx.strokeText(text, x, y);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillText(text, x, y);
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

  getActiveOverlayLayer() {
    const overlayLayers = ["animal", "spirit", "shadowland", "crime"];
    if (overlayLayers.includes(this.currentLayer)) {
      return this.currentLayer;
    }
    if (this.currentLayer === "erase" && overlayLayers.includes(this.currentValue)) {
      return this.currentValue;
    }
    return null;
  }

  drawOverlayLayer(layerName) {
    const map = this.layerMaps[layerName];
    for (const [key, cell] of Object.entries(this.grid)) {
      const val = cell[layerName];
      if (!val || val === "none" || val === 0) continue;
      const [x, y] = key.split(",").map(Number);
      let color = null;
      if (map) {
        const item = typeof val === "number" ? map.idToItem[val] : map.nameToItem[String(val).toLowerCase()];
        if (item && item.color) color = item.color;
      }
      if (!color) {
        if (val === 1 || val === "low") color = "rgba(255, 128, 128, 0.45)";
        else if (val === 2 || val === "medium") color = "rgba(255, 0, 0, 0.55)";
        else if (val === 3 || val === "high") color = "rgba(75, 0, 130, 0.65)";
      }
      if (color) {
        this.fillCell(x, y, color, 1.0);
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

  saveToJSON() {
    return JSON.stringify(this.grid, null, 2);
  }

  loadFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.terrain) {
        this.grid = {};
        const allKeys = new Set();
        for (const lName of Object.keys(parsed)) {
          for (const k of Object.keys(parsed[lName])) allKeys.add(k);
        }
        for (const k of allKeys) {
          const t = parsed.terrain ? parsed.terrain[k] : null;
          const c = parsed.clans ? parsed.clans[k] : null;
          const i = parsed.infrastructure ? parsed.infrastructure[k] : null;
          const s = parsed.settlements ? parsed.settlements[k] : null;
          const txt = parsed.text ? parsed.text[k] : null;

          let tId = 0, cId = 0, vId = 0, rId = 0, resId = 0;
          if (t && this.layerMaps.terrain) {
            const tLower = t.toLowerCase();
            if (tLower === "forest") { tId = 0; vId = 3; }
            else if (tLower === "deserts" || tLower === "desert") { tId = 0; cId = 3; }
            else if (tLower === "plains") { tId = 0; }
            else if (tLower === "marsh") { tId = 7; }
            else if (tLower === "waste") { tId = 0; resId = 13; }
            else if (tLower === "snow") { tId = 0; cId = 5; }
            else { tId = this.layerMaps.terrain.nameToId[tLower] ?? 0; }
          }
          this.grid[k] = { terrain: tId, climate: cId, vegetation: vId, river: rId, resource: resId };
          if (i && this.layerMaps.infrastructure) {
            this.grid[k].infrastructure = this.layerMaps.infrastructure.nameToId[i.toLowerCase()];
          }
          if (c && this.layerMaps.clan) {
            this.grid[k].clan = this.layerMaps.clan.nameToId[c.toLowerCase()];
          }
          if (s) {
            if (typeof s === "string" && this.layerMaps.settlement) {
              this.grid[k].settlement = this.layerMaps.settlement.nameToId[s.toLowerCase()];
            } else if (typeof s === "object") {
              if (this.layerMaps.settlement) {
                this.grid[k].settlement = this.layerMaps.settlement.nameToId[(s.type || "").toLowerCase()];
              }
              if (s.englishName) this.grid[k].englishName = s.englishName;
              if (s.rokuganiName) this.grid[k].rokuganiName = s.rokuganiName;
            }
          }
          if (txt) this.grid[k].text = txt;
          for (const oName of ["animal", "spirit", "shadowland", "crime"]) {
            if (parsed[oName] && parsed[oName][k] !== undefined) {
              let oVal = parsed[oName][k];
              if (typeof oVal === "string" && this.layerMaps[oName]) {
                oVal = this.layerMaps[oName].nameToId[oVal.toLowerCase()] ?? 0;
              }
              this.grid[k][oName] = oVal;
            }
          }
        }
      } else {
        this.grid = parsed;
      }
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
    mapGrid = new WorldMapGrid(canvas.dataset.mapSrc, "#mapCanvas", gridSize);
  }
});