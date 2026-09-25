const VIEWER_GRID_SIZE = 16;
const WATER_TERRAINS_SET = typeof WATER_TERRAINS !== "undefined" ? WATER_TERRAINS : new Set(["water", "coastal water", "ocean"]);

function numOrNull(val) {
  if (val === undefined || val === null || val === "") return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
}

class WorldMapViewer extends WorldMapRenderer {
  constructor(canvasSelector, gridSize = VIEWER_GRID_SIZE) {
    super(canvasSelector, gridSize, { zoom: 0.55 });

    this.terrainCosts = {};
    this.layerVisibility = {
      infrastructure: true,
      clan: true,
      vegetation: true,
      river: true,
      settlement: true,
      resource: true,
      animal: false,
      spirit: false,
      shadowland: false,
      crime: false,
      fertility: false
    };
    this.routePreferences = { includeRisk: false, includeMoney: false };
    this.skillConfig = TravelEventEngine.defaultSkillConfig();

    this.startCell = null;
    this.waypoints = [];
    this.pathResult = null;

    this.travelPapers = {};
    this.avoidClans = {};

    this.setupEventListeners();
    this.loadLayersConfig();
    this.applyZoom();
  }

  redraw() { this.render(); }

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

  async loadMap(jsonUrl) {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error("Failed to load map JSON: " + res.status);
    const parsed = await res.json();
    this.grid = this.normalizeGridData(parsed);
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

  isLayerVisible(layerName) {
    if (layerName === "terrain" || layerName === "climate") return true;
    return this.layerVisibility[layerName] ?? true;
  }

  setLayerVisibility(layerName, visible) {
    if (!(layerName in this.layerVisibility)) return;
    this.layerVisibility[layerName] = visible;
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

  setupEventListeners() {
    this.canvas.addEventListener("click", (e) => this.onCanvasClick(e));
    this.canvas.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
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

    if (vegName === "vegetation") return "vegetation";
    if (climateName === "desert" || climateName === "polar") return climateName;
    if (terrainName === "wetlands" || terrainName === "flat") return terrainName;

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

  render() {
    if (!this.mapWidth) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.zoom, this.zoom);
    // Draw base map tile images
    this.drawBaseTiles();

    // Draw remaining layers
    for (const layerName of this.drawOrder) {
      if (!this.isLayerVisible(layerName)) continue;
      if (layerName === "river") this.drawRiverLayer();
      else if (layerName === "infrastructure") this.drawInfrastructureLayer();
      else if (layerName === "settlement") this.drawSettlementsLayer();
      else if (layerName === "resource") this.drawResourcesLayer();
      else if (layerName === "clan") this.drawClanLayer();
    }

    const activeOverlays = ["animal", "spirit", "shadowland", "crime", "fertility"]
      .filter((layerName) => this.isLayerVisible(layerName));
    this.drawOverlayLayers(activeOverlays);

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

    if (this.drawOrder.includes("text")) this.drawTextLayer();
  }

  drawClanLayer() {
    const cellsByClan = this.clanCellGroups();
    const fillAlpha = 0.15;
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
    mapViewer = new WorldMapViewer("#mapCanvas", gridSize);
  }
});
