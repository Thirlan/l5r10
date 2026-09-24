const MAP_DEFAULT_GRID_SIZE = 16;

// Shared rendering logic for the map builder (WorldMapGrid) and the read-only
// map viewer (WorldMapViewer). Subclasses provide their own repaint entry point
// via redraw(), plus builder- or viewer-specific behaviour (painting, routing).
class WorldMapRenderer {
  constructor(canvasSelector, gridSize = MAP_DEFAULT_GRID_SIZE, { zoom = 0.5 } = {}) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext("2d");
    this.gridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : MAP_DEFAULT_GRID_SIZE;
    this.mapWidth = Number(this.canvas.dataset.mapColumns) * this.gridSize;
    this.mapHeight = Number(this.canvas.dataset.mapRows) * this.gridSize;
    this.zoom = zoom;
    this.minZoom = 0.55;
    this.maxZoom = 4;

    this.layersConfig = null;
    this.drawOrder = ["terrain", "vegetation", "river", "infrastructure", "settlement", "clan", "text"];
    this.layerMaps = {};

    this.grid = {};
    this.tileImageMap = {};
    this.settlementLanguage = "english";

    this.shrineIconCache = {};
    this.settlementImages = {};

    this.shrineImage = new Image();
    this.shrineImage.onload = () => this.redraw();
    this.shrineImage.src = "../img/map/shrine.png";
  }

  // Repaint the whole canvas. Subclasses implement this (draw / render).
  redraw() {}

  async loadMapTileImages() {
    try {
      const res = await fetch("../scripts/map_tile_img.json");
      if (!res.ok) return;
      const entries = await res.json();
      for (const entry of entries) {
        const key = entry.terrain + "," + entry.climate + "," + entry.vegetation;
        const img = new Image();
        img.onload = () => this.redraw();
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
    const riverStripeColors = ["#F4A460", "#ADD8E6", "#0000FF", "#ADD8E6", "#F4A460"];
    const riverStripeOffsets = [-2, -1, 0, 1, 2];

    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.river) continue;
      const [x, y] = key.split(",").map(Number);
      const item = this.layerMaps.river ? this.layerMaps.river.idToItem[cell.river] : null;
      if (!item || item.id === 0) continue;

      const cx = x * this.gridSize + this.gridSize / 2;
      const cy = y * this.gridSize + this.gridSize / 2;
      const ctx = this.ctx;

      ctx.save();
      ctx.lineCap = "round";
      const stripeWidth = Math.max(1.25, (item.lineWidth || 4) * 0.45);
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
      const clanVal = cell.clan;
      let clanName = clanVal;
      if (typeof clanVal === "number" && this.layerMaps.clan) {
        clanName = this.layerMaps.clan.idToName[clanVal] || clanVal;
      }
      if (clanName && clanName !== "none") {
        (cellsByClan[clanName] ||= new Set()).add(key);
      }
    }
    return cellsByClan;
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
    const setItem = this.layerMaps.settlement ? this.layerMaps.settlement.nameToItem[String(typeName).toLowerCase()] : null;

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
    } else if (typeName === "Small Shrine" || typeName === "Large Shrine") {
      this.drawShrine(cx, cy, borderColor, typeName === "Small Shrine" ? 0.75 : 1);
    } else if (setItem && setItem.image) {
      const img = this.settlementImage(setItem.image);
      if (img.complete && img.naturalWidth) ctx.drawImage(img, cx - 6, cy - 6, 12, 12);
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

  settlementImage(src) {
    let img = this.settlementImages[src];
    if (!img) {
      img = new Image();
      img.onload = () => this.redraw();
      img.src = src;
      this.settlementImages[src] = img;
    }
    return img;
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
    return { Village: 6, City: 8, Capital: 10, Fortification: 6, Castle: 8, Kyuden: 10, "Lumber Mill": 6, "Small Shrine": 6, "Large Shrine": 8 }[type] || 6;
  }

  englishSettlementType(type) {
    const item = this.layerMaps.settlement ? this.layerMaps.settlement.nameToItem[String(type).toLowerCase()] : null;
    if (item && item.englishType !== undefined) return item.englishType;
    return type === "Kyuden" ? "Palace" : type;
  }

  rokuganiSettlementType(type) {
    const item = this.layerMaps.settlement ? this.layerMaps.settlement.nameToItem[String(type).toLowerCase()] : null;
    if (item && item.rokuganiType !== undefined) return item.rokuganiType;
    return { Village: "Mura", City: "Toshi", Capital: "Shuto", Fortification: "", Castle: "Shiro", Kyuden: "Kyuden", "Lumber Mill": "Seizaijo", "Small Shrine": "Shōsha", "Large Shrine": "Taisha" }[type] || type;
  }

  drawTextLayer() {
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.text) continue;
      const [x, y] = key.split(",").map(Number);
      this.drawText(x, y, this.textContent(cell.text), cell.text.fontSize || 14);
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
        if (val === 1 || val === "low") color = "rgba(255, 255, 0, 0.45)";
        else if (val === 2 || val === "medium") color = "rgba(255, 165, 0, 0.55)";
        else if (val === 3 || val === "high") color = "rgba(255, 0, 0, 0.65)";
        else if (val === 4 || val === "extreme") color = "rgba(128, 0, 128, 0.75)";
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
}
