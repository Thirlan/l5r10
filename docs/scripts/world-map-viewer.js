const VIEWER_GRID_SIZE = 16;
const WATER_TERRAINS_SET = typeof WATER_TERRAINS !== "undefined" ? WATER_TERRAINS : new Set(["water", "coastal water", "ocean"]);

class WorldMapViewer {
  constructor(imageSrc, canvasSelector, gridSize = VIEWER_GRID_SIZE) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext("2d");
    this.gridSize = gridSize;
    this.zoom = 0.5;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layersConfig = null;
    this.drawOrder = ["terrain", "vegetation", "river", "infrastructure", "settlement", "clan", "text"];
    this.layerMaps = {};

    this.grid = {};
    this.terrainCosts = {};
    this.tileImageMap = {};

    this.viewMode = "default";
    this.settlementLanguage = "english";
    this.routePreferences = { includeRisk: false, includeMoney: false };

    this.skillConfig = TravelEventEngine.defaultSkillConfig();

    this.startCell = null;
    this.waypoints = [];
    this.pathResult = null;

    this.shrineIconCache = {};
    this.travelPapers = {};
    this.avoidClans = {};

    this.mapImage = new Image();
    this.mapImage.onload = () => {
      this.mapWidth = this.mapImage.naturalWidth;
      this.mapHeight = this.mapImage.naturalHeight;
      this.applyZoom();
    };
    this.mapImage.src = imageSrc;

    this.settlementImages = {};

    this.shrineImage = new Image();
    this.shrineImage.onload = () => this.render();
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

      if (this.layerMaps.clan) {
        this.travelPapers = {};
        for (const item of this.layerMaps.clan.def.values) {
          if (item.name && item.name !== "none" && item.name !== "Shadowlands") {
            this.travelPapers[item.name] = true;
          }
        }
      }

      const dataUrl = this.canvas.dataset.mapData;
      if (dataUrl) await this.loadMap(dataUrl);

      const travelUrl = this.canvas.dataset.travelCosts;
      if (travelUrl) await this.loadCosts(travelUrl);

      this.render();
    } catch (err) {
      console.error("Failed to load layers.json in WorldMapViewer:", err);
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
        img.onload = () => this.render();
        img.src = entry.image;
        this.tileImageMap[key] = img;
      }
    } catch (err) {
      console.error("Failed to load map_tile_img.json in WorldMapViewer:", err);
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

  setupEventListeners() {
    this.canvas.addEventListener("click", (e) => this.onCanvasClick(e));
    this.canvas.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
  }

  async loadMap(jsonUrl) {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error("Failed to load map JSON: " + res.status);
    const parsed = await res.json();
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

        let tId = 0, cId = 0, vId = 0, rId = 0;
        if (t && this.layerMaps.terrain) {
          const tLower = t.toLowerCase();
          if (tLower === "forest") { tId = 0; vId = 3; }
          else if (tLower === "deserts" || tLower === "desert") { tId = 0; cId = 3; }
          else if (tLower === "plains") { tId = 0; }
          else if (tLower === "marsh") { tId = 7; }
          else if (tLower === "waste") { tId = 0; }
          else if (tLower === "snow") { tId = 0; cId = 4; }
          else { tId = this.layerMaps.terrain.nameToId[tLower] ?? 0; }
        }
        this.grid[k] = { terrain: tId, climate: cId, vegetation: vId, river: rId };
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
    this.render();
  }

  async loadCosts(csvUrl) {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error("Failed to load travel lookup CSV: " + res.status);
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);
    const cols = lines.shift().split(",").map((s) => s.trim());
    this.terrainCosts = {};
    for (const line of lines) {
      const values = line.split(",").map((s) => s.trim());
      const entry = {};
      cols.forEach((c, i) => { entry[c] = values[i]; });
      this.terrainCosts[(entry.Terrain || "").toLowerCase()] = {
        cost: numOrNull(entry["Cost Minutes"]),
        costRoad: numOrNull(entry["Cost With Road Minutes"]),
        prob: numOrNull(entry.Probability),
        probRoad: numOrNull(entry["Probability with road"]),
        skill: (entry.Skill || "").toLowerCase(),
        tn: numOrNull(entry.TN),
        tnRoad: numOrNull(entry["TN with road"]),
        zeni: numOrNull(entry["Cost Zeni"]),
        zeniRoad: numOrNull(entry["Cost Zeni with road"])
      };
    }
  }

  setViewMode(mode) { this.viewMode = mode; this.render(); }

  setSettlementLanguage(language) {
    if (!["english", "rokugani"].includes(language)) return;
    this.settlementLanguage = language;
    this.render();
  }

  setRoutePreference(preference, enabled) {
    if (!(preference in this.routePreferences)) return;
    this.routePreferences[preference] = enabled;
    if (this.startCell && this.waypoints.length) this.computePath();
  }

  setSkillConfig(skill, patch) {
    if (!this.skillConfig[skill]) return;
    Object.assign(this.skillConfig[skill], patch);
  }

  onCanvasClick(event) {
    const cell = this.getGridCell(event);
    if (cell.x < 0 || cell.y < 0) return;
    if (!this.startCell) {
      this.startCell = cell;
      this.waypoints = [];
      this.pathResult = null;
      this.render();
      this.updateResultDisplay();
      return;
    }
    this.waypoints.push(cell);
    this.computePath();
  }

  clearPath() {
    this.startCell = null;
    this.waypoints = [];
    this.pathResult = null;
    this.render();
    this.updateResultDisplay();
  }

  removeLastWaypoint() {
    if (!this.waypoints.length) return;
    this.waypoints.pop();
    if (this.waypoints.length) {
      this.computePath();
    } else {
      this.pathResult = null;
      this.render();
      this.updateResultDisplay();
    }
  }

  getGridCell(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mapX = (event.clientX - rect.left) / this.zoom;
    const mapY = (event.clientY - rect.top) / this.zoom;
    return { x: Math.floor(mapX / this.gridSize), y: Math.floor(mapY / this.gridSize) };
  }

  cellData(cx, cy) {
    return this.grid[cx + "," + cy] || null;
  }

  cellTerrain(cx, cy) {
    const cell = this.cellData(cx, cy);
    if (!cell) return null;
    let tName = cell.terrain;
    if (typeof tName === "number" && this.layerMaps.terrain) {
      tName = this.layerMaps.terrain.idToName[tName] || "flat";
    }
    return tName || "flat";
  }

  cellClan(cx, cy) {
    const cell = this.cellData(cx, cy);
    if (!cell || !cell.clan) return null;
    let cName = cell.clan;
    if (typeof cName === "number" && this.layerMaps.clan) {
      cName = this.layerMaps.clan.idToName[cName];
    }
    return cName || null;
  }

  cellInfrastructure(cx, cy) {
    const cell = this.cellData(cx, cy);
    if (!cell || !cell.infrastructure) return null;
    let iName = cell.infrastructure;
    if (typeof iName === "number" && this.layerMaps.infrastructure) {
      iName = this.layerMaps.infrastructure.idToName[iName];
    }
    return iName || null;
  }

  cellHasRoad(cx, cy) {
    const infra = this.cellInfrastructure(cx, cy);
    return ["Road", "Footpath"].includes(infra);
  }

  tileCostKey(cx, cy) {
    const cell = this.cellData(cx, cy);
    if (!cell) return null;

    const terrainName = (this.cellTerrain(cx, cy) || "flat").toLowerCase();
    const vegVal = cell.vegetation || 0;
    const climateVal = cell.climate || 0;

    let vegName = "";
    if (typeof vegVal === "number" && this.layerMaps.vegetation) {
      vegName = (this.layerMaps.vegetation.idToName[vegVal] || "").toLowerCase();
    }
    let climateName = "";
    if (typeof climateVal === "number" && this.layerMaps.climate) {
      climateName = (this.layerMaps.climate.idToName[climateVal] || "").toLowerCase();
    }

    if (vegName === "light" || vegName === "dense") return "forest";
    if (climateName === "desert") return "deserts";
    if (climateName === "polar") return "snow";
    if (terrainName === "wetlands") return "marsh";
    if (terrainName === "flat") return "plains";

    return terrainName;
  }

  tileData(cx, cy, mode) {
    const terrain = this.cellTerrain(cx, cy);
    if (!terrain) return null;

    const lookupKey = this.tileCostKey(cx, cy);
    const data = this.terrainCosts[lookupKey] || this.terrainCosts[terrain.toLowerCase()];
    if (!data) return null;

    const isWater = WATER_TERRAINS_SET.has(terrain.toLowerCase()) || WATER_TERRAINS_SET.has(terrain);
    const hasRoad = this.cellHasRoad(cx, cy) && (!isWater || mode === "foot");
    return {
      terrain,
      hasRoad,
      cost: hasRoad && data.costRoad !== null ? data.costRoad : data.cost,
      zeni: hasRoad && data.zeniRoad !== null ? data.zeniRoad : data.zeni,
      skill: data.skill,
      tn: hasRoad && data.tnRoad !== null ? data.tnRoad : data.tn,
      prob: hasRoad && data.probRoad !== null ? data.probRoad : data.prob
    };
  }

  computePath() {
    if (!this.startCell || !this.waypoints.length) return;
    const pather = new L5RPathing({
      getTerrain: (x, y) => this.cellTerrain(x, y),
      getTileData: (x, y, mode) => this.tileData(x, y, mode),
      getInfrastructure: (x, y) => this.cellInfrastructure(x, y),
      getClan: (x, y) => this.cellClan(x, y),
      skillConfig: this.skillConfig,
      travelPapers: this.travelPapers,
      avoidClans: this.avoidClans,
      ...this.routePreferences
    });
    this.pathResult = pather.computeRoute(this.startCell, this.waypoints);
    this.render();
    this.updateResultDisplay();
  }

  updateResultDisplay() {
    const el = document.getElementById("pathSummary");
    const eventTable = document.getElementById("pathEvents");
    if (!el) return;
    if (!this.pathResult) {
      el.textContent = this.startCell
        ? "Start selected — click waypoints; the last click is the destination."
        : "Click a starting tile.";
      if (eventTable) eventTable.hidden = true;
      return;
    }
    if (this.pathResult.failed) {
      const segNote = this.pathResult.failedSegment != null ? " between waypoints " + (this.pathResult.failedSegment - 1) + " and " + this.pathResult.failedSegment : "";
      el.textContent = "No route found" + segNote + ".";
      if (eventTable) eventTable.hidden = true;
      return;
    }
    const m = this.pathResult.totalMinutes;
    const days = Math.floor(m / MINUTES_PER_DAY);
    const hours = Math.floor((m % MINUTES_PER_DAY) / 60);
    const mins = m % 60;
    const cur = L5RCurrency.fromZeni(this.pathResult.totalZeni);
    el.innerHTML =
      "<strong>Time:</strong> " + days + " d " + hours + " h " + mins + " m &nbsp;&middot;&nbsp; " +
      "<strong>Cost:</strong> " + cur.koku + " koku, " + cur.bu + " bu, " + cur.zeni + " zeni &nbsp;&middot;&nbsp; " +
      "<strong>Mishaps:</strong> " + this.pathResult.mishaps.size + " &nbsp;&middot;&nbsp; " +
      "<strong>Tiles:</strong> " + (this.pathResult.path.length - 1) + " &nbsp;&middot;&nbsp; " +
      "<strong>Waypoints:</strong> " + this.waypoints.length;
    if (eventTable) {
      const rows = this.pathResult.events.map((event) =>
        "<tr><td>" + event.day + "</td><td>" + event.coord + "</td><td>" + event.event + "</td><td>" + event.mode + "</td>" +
        "<td>" + event.terrain + "</td><td>" + event.clan + "</td><td>" + event.skill + "</td><td>" + event.tn + "</td>" +
        "<td>" + event.result + "</td><td>" + event.cost + "</td></tr>"
      ).join("");
      eventTable.querySelector("tbody").innerHTML = rows;
      eventTable.hidden = false;
    }
  }

  setZoom(z) { this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, z)); this.applyZoom(); }
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
    this.render();
    const label = document.getElementById("zoomLevel");
    if (label) label.textContent = Math.round(this.zoom * 100) + "%";
  }

  render() {
    if (!this.mapWidth) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.zoom, this.zoom);
    ctx.drawImage(this.mapImage, 0, 0, this.mapWidth, this.mapHeight);

    // Draw base map tile images
    this.drawBaseTiles();

    // Draw remaining layers
    for (const layerName of this.drawOrder) {
      if (layerName === "river") this.drawRiverLayer();
      else if (layerName === "infrastructure") this.drawInfrastructureLayer();
      else if (layerName === "settlement") this.drawSettlements();
      else if (layerName === "clan" && this.viewMode !== "terrain") this.drawClanLayer();
      else if (layerName === "text") this.drawTextLayer();
    }

    if (["animal", "spirit", "shadowland", "crime"].includes(this.viewMode)) {
      this.drawOverlayLayer(this.viewMode);
    }

    this.drawGrid();

    if (this.pathResult && this.pathResult.path.length) {
      for (const key of this.pathResult.mishaps) {
        const [x, y] = key.split(",").map(Number);
        this.fillCell(x, y, "#FF0000", 0.55);
      }
      this.drawPath(this.pathResult.path);
      for (const [key, label] of this.pathResult.dayMarkers) {
        const [x, y] = key.split(",").map(Number);
        this.drawText(x, y, label, 8);
      }
    }
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
      const item = this.layerMaps.river ? this.layerMaps.river.idToItem[cell.river] : null;
      if (!item || item.id === 0) continue;

      const cx = x * this.gridSize + this.gridSize / 2;
      const cy = y * this.gridSize + this.gridSize / 2;
      const ctx = this.ctx;

      ctx.save();
      ctx.strokeStyle = item.color || "#1E90FF";
      ctx.lineWidth = item.lineWidth || (cell.river === 2 ? 4 : 2);
      ctx.lineCap = "round";

      const neighbors = [[1,0], [0,1], [-1,0], [0,-1]];
      let connected = false;
      for (const [dx, dy] of neighbors) {
        const neighborCell = this.grid[(x + dx) + "," + (y + dy)];
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
      const neighbourCell = this.grid[(x + dx) + "," + (y + dy)];
      if (!neighbourCell || !neighbourCell.infrastructure) return;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawClanLayer() {
    const cellsByClan = {};
    for (const [key, cell] of Object.entries(this.grid)) {
      if (!cell.clan) continue;
      const cVal = cell.clan;
      let clanName = cVal;
      if (typeof cVal === "number" && this.layerMaps.clan) {
        clanName = this.layerMaps.clan.idToName[cVal] || cVal;
      }
      if (clanName && clanName !== "none") {
        (cellsByClan[clanName] ||= new Set()).add(key);
      }
    }

    const fillAlpha = this.viewMode === "clan" ? 0.4 : 0.15;
    for (const [clan, cells] of Object.entries(cellsByClan)) {
      const colors = this.layerMaps.clan ? this.layerMaps.clan.nameToItem[clan.toLowerCase()] : { border: "#00008B", fill: "#808080" };
      if (!colors) continue;
      const polygons = this.traceClanPolygons(cells);
      if (!polygons.length) continue;
      this.drawClanShape(cells, polygons, colors, fillAlpha);
    }
  }

  drawClanShape(cells, polygons, colors, fillAlpha) {
    const size = this.gridSize;
    this.ctx.save();
    this.ctx.lineJoin = "miter";
    this.ctx.lineCap = "square";

    const clip = new Path2D();
    for (const key of cells) {
      const [cx, cy] = key.split(",").map(Number);
      clip.rect(cx * size, cy * size, size, size);
    }
    this.ctx.clip(clip);

    const path = new Path2D();
    for (const poly of polygons) {
      path.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) path.lineTo(poly[i][0], poly[i][1]);
      path.closePath();
    }

    if (colors.fill && fillAlpha > 0) {
      this.ctx.fillStyle = colors.fill;
      this.ctx.globalAlpha = fillAlpha;
      this.ctx.fill(path);
      this.ctx.globalAlpha = 1.0;
    }

    this.ctx.strokeStyle = colors.border || "#00008B";
    this.ctx.lineWidth = 6 / this.zoom;
    this.ctx.stroke(path);

    this.ctx.strokeStyle = "#444444";
    this.ctx.lineWidth = 1.5 / this.zoom;
    this.ctx.stroke(path);

    this.ctx.restore();
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

  drawSettlements() {
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

    const clanName = this.cellClan(x, y);
    const clanColors = this.layerMaps.clan ? this.layerMaps.clan.nameToItem[String(clanName).toLowerCase()] : { border: "#444444", fill: "#DDDDDD" };
    const setItem = this.layerMaps.settlement ? this.layerMaps.settlement.nameToItem[String(typeName).toLowerCase()] : null;

    const fillColor = (clanColors ? clanColors.fill : "#DDDDDD") || "#DDDDDD";
    const borderColor = (clanColors ? clanColors.border : "#444444") || "#444444";

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
      img.onload = () => this.render();
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
    return { Village: 8, City: 10, Capital: 12, Fortification: 8, Castle: 10, Kyuden: 12, "Lumber Mill": 8, "Small Shrine": 8, "Large Shrine": 10 }[type] || 8;
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

  drawPath(path) {
    if (!path || path.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3 / this.zoom;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    const start = path[0];
    ctx.moveTo(start.x * this.gridSize + this.gridSize / 2, start.y * this.gridSize + this.gridSize / 2);
    for (let i = 1; i < path.length; i++) {
      const p = path[i];
      ctx.lineTo(p.x * this.gridSize + this.gridSize / 2, p.y * this.gridSize + this.gridSize / 2);
    }
    ctx.stroke();
    ctx.restore();
  }
}

let mapViewer;
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("#mapCanvas");
  if (canvas) {
    const gridSize = Number.parseInt(canvas.dataset.gridSize, 10);
    mapViewer = new WorldMapViewer(canvas.dataset.mapSrc, "#mapCanvas", gridSize);
  }
});