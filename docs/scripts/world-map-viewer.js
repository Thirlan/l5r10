const VIEWER_GRID_SIZE = 16;
const WATER_TERRAINS = new Set(['Water', 'Ocean', 'Deep Ocean']);
const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 18 * 60;
const MINUTES_PER_DAY = 24 * 60;
const MISHAP_PENALTY_MIN = 1440;
const SWIM_PENALTY_MIN = 10000;
const DIAGONAL_COST_MULTIPLIER = 1.41;
class WorldMapViewer {
  constructor(imageSrc, canvasSelector, gridSize = VIEWER_GRID_SIZE) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = gridSize;
    this.zoom = 0.5;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layers = { terrain: {}, clans: {}, infrastructure: {}, text: {} };
    this.terrainCosts = {};

    this.viewMode = 'default';
    this.strategy = 'risky';

    this.skillConfig = {
      survival:    { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      sailing:     { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      investigate: { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      swim:        { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false, tn: 15 }
    };

    this.startCell = null;
    this.waypoints = [];
    this.pathResult = null;

    this.terrainColors = {
      Mountain: '#8B7355', Ocean: '#4169E1', Water: '#1E90FF', Forest: '#228B22',
      Plains: '#90EE90', Hills: '#DAA520', Deserts: '#F4A460', Marsh: '#556B2F',
      'Deep Ocean': '#00008B', Snow: '#F0F8FF', City: '#FF6347'
    };
    this.clanColors = {
      Crane: '#87CEEB', Lion: '#8B4513', Crab: '#00008B', Dragon: '#90EE90',
      Unicorn: '#800080', Scorpion: '#FF0000', Imperial: '#FFFFFF',
      Shadowlands: '#000000', Phoenix: '#FFA500', Mantis: '#006400', 'Minor Clan': '#808080'
    };

    this.mapImage = new Image();
    this.mapImage.onload = () => {
      this.mapWidth = this.mapImage.naturalWidth;
      this.mapHeight = this.mapImage.naturalHeight;
      this.applyZoom();
    };
    this.mapImage.src = imageSrc;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
  }

  async loadMap(jsonUrl) {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`Failed to load map JSON: ${res.status}`);
    const parsed = await res.json();
    this.layers = {
      terrain: parsed.terrain || {},
      clans: parsed.clans || {},
      infrastructure: parsed.infrastructure || {},
      text: parsed.text || {}
    };
    this.render();
  }

  async loadCosts(csvUrl) {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Failed to load travel lookup CSV: ${res.status}`);
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);
    const cols = lines.shift().split(',').map((s) => s.trim());
    this.terrainCosts = {};
    for (const line of lines) {
      const values = line.split(',').map((s) => s.trim());
      const entry = {};
      cols.forEach((c, i) => { entry[c] = values[i]; });
      this.terrainCosts[(entry.Terrain || '').toLowerCase()] = {
        cost: numOrNull(entry['Cost Minutes']),
        costRoad: numOrNull(entry['Cost With Road Minutes']),
        skill: (entry.Skill || '').toLowerCase(),
        tn: numOrNull(entry.TN),
        tnRoad: numOrNull(entry['TN with road']),
        zeni: numOrNull(entry['Cost Zeni']),
        zeniRoad: numOrNull(entry['Cost Zeni with road'])
      };
    }
  }

  setViewMode(mode) { this.viewMode = mode; this.render(); }

  setStrategy(strategy) {
    this.strategy = strategy;
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

  cellTerrain(cx, cy) { return this.layers.terrain[`${cx},${cy}`] || null; }
  cellHasRoad(cx, cy) { return Object.prototype.hasOwnProperty.call(this.layers.infrastructure, `${cx},${cy}`); }

  // Costs, skill, TN and zeni for entering a tile (road-adjusted, water tiles ignore roads).
  tileData(cx, cy) {
    const terrain = this.cellTerrain(cx, cy);
    if (!terrain) return null;
    const data = this.terrainCosts[terrain.toLowerCase()];
    if (!data) return null;
    const hasRoad = !WATER_TERRAINS.has(terrain) && this.cellHasRoad(cx, cy);
    return {
      terrain,
      hasRoad,
      cost: hasRoad && data.costRoad !== null ? data.costRoad : data.cost,
      zeni: hasRoad && data.zeniRoad !== null ? data.zeniRoad : data.zeni,
      skill: data.skill,
      tn: hasRoad && data.tnRoad !== null ? data.tnRoad : data.tn
    };
  }

  // Water/Ocean/Deep Ocean can only be entered/exited via a City tile; Swim (if allowed) opens Water tiles too.
  canTraverse(from, to) {
    const fromT = this.cellTerrain(from.x, from.y);
    const toT = this.cellTerrain(to.x, to.y);
    if (!fromT || !toT) return false;
    const fromWater = WATER_TERRAINS.has(fromT);
    const toWater = WATER_TERRAINS.has(toT);
    if (fromWater === toWater) return true;
    const other = fromWater ? toT : fromT;
    if (other === 'City') return true;
    const water = fromWater ? fromT : toT;
    if (water === 'Water' && this.skillConfig.swim.allowed) return true;
    return false;
  }

  edgeCost(from, to) {
    const t = this.tileData(to.x, to.y);
    if (!t || t.cost === null) return null;
    let cost = t.cost;
    const fromT = this.cellTerrain(from.x, from.y);
    if (t.terrain === 'Water' && fromT !== 'City') cost += 300;
    return cost;
  }

  // Skill/TN/penalty for entering `to` from `from` — Swim overrides Water tiles that aren't reached from a City.
  skillCheckForMove(from, to) {
    const t = this.tileData(to.x, to.y);
    if (!t) return null;
    const fromT = this.cellTerrain(from.x, from.y);
    if (t.terrain === 'Water' && fromT !== 'City') {
      return { skill: 'swim', tn: this.skillConfig.swim.tn, penalty: SWIM_PENALTY_MIN };
    }
    if (!t.skill || t.tn === null) return null;
    return { skill: t.skill, tn: t.tn, penalty: MISHAP_PENALTY_MIN };
  }

  rollOne(cfg) {
    let total = 0;
    let d = 1 + Math.floor(Math.random() * 10);
    if (cfg.rerollOnes && d === 1) d = 1 + Math.floor(Math.random() * 10);
    total += d;
    while (d === 10 || (cfg.explodeOnNines && d === 9)) {
      d = 1 + Math.floor(Math.random() * 10);
      total += d;
    }
    return total;
  }

  rollDice(cfg) {
    const results = [];
    for (let i = 0; i < cfg.roll; i++) results.push(this.rollOne(cfg));
    results.sort((a, b) => b - a);
    return results.slice(0, cfg.keep).reduce((s, v) => s + v, 0) + cfg.mod;
  }

  // Cached Monte Carlo failure probability for the tile-and-transition's skill check.
  mishapProbability(from, to) {
    const check = this.skillCheckForMove(from, to);
    if (!check) return 0;
    const cfg = this.skillConfig[check.skill];
    if (!cfg) return 0;
    const cacheKey = `${check.skill}|${check.tn}|${cfg.roll}|${cfg.keep}|${cfg.mod}|${cfg.rerollOnes ? 1 : 0}|${cfg.explodeOnNines ? 1 : 0}`;
    if (!this._probCache) this._probCache = new Map();
    if (this._probCache.has(cacheKey)) return this._probCache.get(cacheKey);
    const trials = 300;
    let fails = 0;
    for (let i = 0; i < trials; i++) if (this.rollDice(cfg) < check.tn) fails++;
    const p = fails / trials;
    this._probCache.set(cacheKey, p);
    return p;
  }

  findPath(start, end) {
    const key = (c) => `${c.x},${c.y}`;
    const startKey = key(start);
    const endKey = key(end);
    if (!this.cellTerrain(start.x, start.y) || !this.cellTerrain(end.x, end.y)) return null;

    const gScore = new Map([[startKey, 0]]);
    const cameFrom = new Map();
    const open = new Map([[startKey, { cell: start, f: this.heuristic(start, end) }]]);

    while (open.size) {
      let curKey = null;
      let cur = null;
      for (const [k, node] of open) {
        if (cur === null || node.f < cur.f) { cur = node; curKey = k; }
      }
      open.delete(curKey);

      if (curKey === endKey) {
        const path = [cur.cell];
        let k = curKey;
        while (cameFrom.has(k)) {
          k = cameFrom.get(k);
          const [x, y] = k.split(',').map(Number);
          path.unshift({ x, y });
        }
        return path;
      }

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const next = { x: cur.cell.x + dx, y: cur.cell.y + dy };
        if (!this.canTraverse(cur.cell, next)) continue;
        const base = this.edgeCost(cur.cell, next);
        if (base === null) continue;
        const diag = dx !== 0 && dy !== 0;
        let step = Math.round(base * (diag ? DIAGONAL_COST_MULTIPLIER : 1));
        if (this.strategy === 'safe') {
          const check = this.skillCheckForMove(cur.cell, next);
          if (check) step += this.mishapProbability(cur.cell, next) * check.penalty;
        }
        const tentative = gScore.get(curKey) + step;
        const nk = key(next);
        if (tentative < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, tentative);
          cameFrom.set(nk, curKey);
          open.set(nk, { cell: next, f: tentative + this.heuristic(next, end) });
        }
      }
    }
    return null;
  }

  // Octile distance keeps the heuristic admissible for 8-connected movement.
  heuristic(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (Math.max(dx, dy) + (DIAGONAL_COST_MULTIPLIER - 1) * Math.min(dx, dy)) * 100;
  }

  // Walks the path once, rolling skill dice per tile and accumulating time, cost, mishaps, day markers.
  simulate(path) {
    const mishaps = new Set();
    const dayMarkers = new Map();
    let totalMinutes = 0;
    let totalZeni = 0;
    let clock = DAY_START_MIN;
    let daysElapsed = 0;

    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      const base = this.edgeCost(from, to);
      const t = this.tileData(to.x, to.y);
      const diag = from.x !== to.x && from.y !== to.y;
      let tileMinutes = Math.round(base * (diag ? DIAGONAL_COST_MULTIPLIER : 1));

      const check = this.skillCheckForMove(from, to);
      if (check) {
        const cfg = this.skillConfig[check.skill];
        if (cfg && this.rollDice(cfg) < check.tn) {
          mishaps.add(`${to.x},${to.y}`);
          tileMinutes += check.penalty;
        }
      }

      totalMinutes += tileMinutes;
      totalZeni += t.zeni ?? 0;
      clock += tileMinutes;

      const timeOfDay = ((clock % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      const pastSundown = timeOfDay >= DAY_END_MIN || timeOfDay < DAY_START_MIN;
      const nextTile = path[i + 1];
      const nextIsWater = nextTile && WATER_TERRAINS.has(this.cellTerrain(nextTile.x, nextTile.y));
      if (pastSundown && nextTile && !nextIsWater) {
        const dayStart = clock - timeOfDay;
        const nextMorning = dayStart + MINUTES_PER_DAY + DAY_START_MIN;
        const sleep = nextMorning - clock;
        totalMinutes += sleep;
        clock = nextMorning;
        daysElapsed += 1;
        dayMarkers.set(`${to.x},${to.y}`, `${daysElapsed}d`);
      }
    }

    return { path, totalMinutes, totalZeni, mishaps, dayMarkers };
  }

  computePath() {
    if (!this.startCell || !this.waypoints.length) return;
    const anchors = [this.startCell, ...this.waypoints];
    const combined = [anchors[0]];
    for (let i = 1; i < anchors.length; i++) {
      const segment = this.findPath(anchors[i - 1], anchors[i]);
      if (!segment) {
        this.pathResult = { path: [], totalMinutes: 0, totalZeni: 0, mishaps: new Set(), dayMarkers: new Map(), failed: true, failedSegment: i };
        this.render();
        this.updateResultDisplay();
        return;
      }
      for (let j = 1; j < segment.length; j++) combined.push(segment[j]);
    }
    this.pathResult = this.simulate(combined);
    this.render();
    this.updateResultDisplay();
  }

  updateResultDisplay() {
    const el = document.getElementById('pathSummary');
    if (!el) return;
    if (!this.pathResult) {
      el.textContent = this.startCell
        ? 'Start selected — click waypoints; the last click is the destination.'
        : 'Click a starting tile.';
      return;
    }
    if (this.pathResult.failed) {
      const segNote = this.pathResult.failedSegment != null ? ` between waypoints ${this.pathResult.failedSegment - 1} and ${this.pathResult.failedSegment}` : '';
      el.textContent = `No route found${segNote}.`;
      return;
    }
    const m = this.pathResult.totalMinutes;
    const days = Math.floor(m / MINUTES_PER_DAY);
    const hours = Math.floor((m % MINUTES_PER_DAY) / 60);
    const mins = m % 60;
    const cur = L5RCurrency.fromZeni(this.pathResult.totalZeni);
    el.innerHTML =
      `<strong>Time:</strong> ${days} d ${hours} h ${mins} m &nbsp;&middot;&nbsp; ` +
      `<strong>Cost:</strong> ${cur.koku} koku, ${cur.bu} bu, ${cur.zeni} zeni &nbsp;&middot;&nbsp; ` +
      `<strong>Mishaps:</strong> ${this.pathResult.mishaps.size} &nbsp;&middot;&nbsp; ` +
      `<strong>Tiles:</strong> ${this.pathResult.path.length - 1} &nbsp;&middot;&nbsp; ` +
      `<strong>Waypoints:</strong> ${this.waypoints.length}`;
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
    const label = document.getElementById('zoomLevel');
    if (label) label.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  render() {
    if (!this.mapWidth) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.zoom, this.zoom);
    ctx.drawImage(this.mapImage, 0, 0, this.mapWidth, this.mapHeight);

    const terrainAlpha = this.viewMode === 'terrain' ? 0.85 : this.viewMode === 'clan' ? 0 : 0.2;
    if (terrainAlpha > 0) {
      for (const [key, name] of Object.entries(this.layers.terrain)) {
        const [x, y] = key.split(',').map(Number);
        this.fillCell(x, y, this.terrainColors[name], terrainAlpha);
      }
    }

    if (this.viewMode !== 'terrain') {
      const cellsByClan = {};
      for (const [key, clan] of Object.entries(this.layers.clans)) {
        (cellsByClan[clan] ||= new Set()).add(key);
      }
      const fillAlpha = this.viewMode === 'clan' ? 0.4 : 0.15;
      for (const [clan, cells] of Object.entries(cellsByClan)) {
        const color = this.clanColors[clan];
        if (!color) continue;
        const polygons = this.traceClanPolygons(cells);
        if (!polygons.length) continue;
        this.drawClanShape(cells, polygons, color, fillAlpha);
      }
    }

    for (const key of Object.keys(this.layers.infrastructure)) {
      const [x, y] = key.split(',').map(Number);
      this.drawRoad(x, y);
    }

    this.drawGrid();

    if (this.pathResult && this.pathResult.path.length) {
      for (const key of this.pathResult.mishaps) {
        const [x, y] = key.split(',').map(Number);
        this.fillCell(x, y, '#FF0000', 0.55);
      }
      this.drawPath(this.pathResult.path);
      for (const [key, label] of this.pathResult.dayMarkers) {
        const [x, y] = key.split(',').map(Number);
        this.drawText(x, y, label, 8);
      }
    }

    if (this.startCell) this.drawMarker(this.startCell, '#22DD22');
    for (let i = 0; i < this.waypoints.length; i++) {
      const isLast = i === this.waypoints.length - 1;
      this.drawMarker(this.waypoints[i], isLast ? '#DD2222' : '#FFAA00');
    }

    for (const [key, data] of Object.entries(this.layers.text)) {
      const [x, y] = key.split(',').map(Number);
      this.drawText(x, y, data.text, data.fontSize);
    }
  }

  fillCell(x, y, color, alpha = 1) {
    if (!color) return;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    this.ctx.restore();
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1 / this.zoom;
    for (let x = 0; x <= this.mapWidth; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.mapHeight); ctx.stroke();
    }
    for (let y = 0; y <= this.mapHeight; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.mapWidth, y); ctx.stroke();
    }
  }

  drawRoad(x, y) {
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    this.ctx.strokeStyle = '#5C3A1E';
    this.ctx.fillStyle = '#5C3A1E';
    this.ctx.lineWidth = 3 / this.zoom;
    this.ctx.lineCap = 'round';
    const forward = [[1, 0], [0, 1], [1, 1], [1, -1]];
    forward.forEach(([dx, dy]) => {
      if (!(`${x + dx},${y + dy}` in this.layers.infrastructure)) return;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
      this.ctx.stroke();
    });
    const isolated = forward
      .flatMap(([dx, dy]) => [[dx, dy], [-dx, -dy]])
      .every(([dx, dy]) => !(`${x + dx},${y + dy}` in this.layers.infrastructure));
    if (isolated) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawText(x, y, text, fontSize) {
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = Math.max(2, fontSize / 6);
    this.ctx.strokeText(text, cx, cy);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(text, cx, cy);
  }

  drawPath(path) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#FFD500';
    ctx.lineWidth = 6 / this.zoom;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const s = this.gridSize;
    for (let i = 0; i < path.length; i++) {
      const px = path[i].x * s + s / 2;
      const py = path[i].y * s + s / 2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = '#8A6000';
    ctx.lineWidth = 2 / this.zoom;
    ctx.stroke();
    ctx.restore();
  }

  drawMarker(cell, color) {
    const ctx = this.ctx;
    const s = this.gridSize;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 / this.zoom;
    ctx.beginPath();
    ctx.arc(cell.x * s + s / 2, cell.y * s + s / 2, s / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawClanShape(cells, polygons, color, fillAlpha) {
    const size = this.gridSize;
    this.ctx.save();
    this.ctx.globalAlpha = fillAlpha;
    this.ctx.fillStyle = color;
    for (const key of cells) {
      const [cx, cy] = key.split(',').map(Number);
      this.ctx.fillRect(cx * size, cy * size, size, size);
    }
    this.ctx.globalAlpha = 1;

    const clip = new Path2D();
    for (const key of cells) {
      const [cx, cy] = key.split(',').map(Number);
      clip.rect(cx * size, cy * size, size, size);
    }
    this.ctx.clip(clip);

    const stroke = new Path2D();
    for (const poly of polygons) {
      stroke.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) stroke.lineTo(poly[i][0], poly[i][1]);
      stroke.closePath();
    }
    this.ctx.lineJoin = 'miter';
    this.ctx.lineCap = 'square';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 12 / this.zoom;
    this.ctx.stroke(stroke);
    this.ctx.strokeStyle = this.tintClanColor(color);
    this.ctx.lineWidth = 6 / this.zoom;
    this.ctx.stroke(stroke);
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.stroke(stroke);
    this.ctx.restore();
  }

  // Chains directed cell-boundary edges (clockwise, interior on the right) into closed polygons.
  traceClanPolygons(cellSet) {
    const size = this.gridSize;
    const edges = new Map();
    const addEdge = (a, b) => {
      if (!edges.has(a)) edges.set(a, []);
      edges.get(a).push(b);
    };
    const has = (cx, cy) => cellSet.has(`${cx},${cy}`);
    for (const key of cellSet) {
      const [cx, cy] = key.split(',').map(Number);
      if (!has(cx, cy - 1)) addEdge(`${cx},${cy}`, `${cx + 1},${cy}`);
      if (!has(cx + 1, cy)) addEdge(`${cx + 1},${cy}`, `${cx + 1},${cy + 1}`);
      if (!has(cx, cy + 1)) addEdge(`${cx + 1},${cy + 1}`, `${cx},${cy + 1}`);
      if (!has(cx - 1, cy)) addEdge(`${cx},${cy + 1}`, `${cx},${cy}`);
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
      polygons.push(polygon.map((v) => v.split(',').map((n) => Number(n) * size)));
    }
    return polygons;
  }

  // Mixes 55% toward white, or toward dark grey when the source is already very light.
  tintClanColor(hex) {
    const c = hex.replace('#', '');
    if (c.length !== 6) return '#FFFFFF';
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const target = luminance > 200 ? 90 : 255;
    const mix = (channel) => Math.round(channel + (target - channel) * 0.55);
    return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
}

function numOrNull(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

let mapViewer;
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.querySelector('#mapCanvas');
  if (!canvas) return;
  const gridSize = Number.parseInt(canvas.dataset.gridSize, 10) || VIEWER_GRID_SIZE;
  mapViewer = new WorldMapViewer(canvas.dataset.mapSrc, '#mapCanvas', gridSize);
  try {
    await Promise.all([
      mapViewer.loadMap(canvas.dataset.mapData),
      mapViewer.loadCosts(canvas.dataset.travelCosts)
    ]);
  } catch (err) {
    console.error(err);
    const summary = document.getElementById('pathSummary');
    if (summary) summary.textContent = `Failed to load map data: ${err.message}`;
  }
});
