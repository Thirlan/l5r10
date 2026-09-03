const VIEWER_GRID_SIZE = 16;
class WorldMapViewer {
  constructor(imageSrc, canvasSelector, gridSize = VIEWER_GRID_SIZE) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = gridSize;
    this.zoom = 0.5;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layers = { terrain: {}, clans: {}, infrastructure: {}, settlements: {}, text: {} };
    this.terrainCosts = {};

    this.viewMode = 'default';
    this.settlementLanguage = 'english';
    this.routePreferences = { includeRisk: false, includeMoney: false };

    this.skillConfig = {
      survival:    { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      sailing:     { roll: 6, keep: 3, mod: 0, rerollOnes: false, explodeOnNines: false },
      investigate: { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      swim:        { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false, tn: 20 },
      sneak:       { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false },
      forgery:     { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false }
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
      Crab: { border: '#00008B', fill: '#808080' },
      Crane: { border: '#87CEEB', fill: '#FFFFFF' },
      Dragon: { border: '#228B22', fill: '#FFFF00' },
      Lion: { border: '#8B4513', fill: '#D4A017' },
      Phoenix: { border: '#FFD700', fill: '#FFA500' },
      Scorpion: { border: '#FF0000', fill: '#000000' },
      Unicorn: { border: '#800080', fill: '#FFFF00' },
      Imperial: { border: '#D4AF37', fill: '#FFFFFF' },
      Hare: { border: '#FF0000', fill: '#FFFFFF' },
      Centipede: { border: '#FFA500', fill: '#8B4513' },
      Fox: { border: '#C4A484', fill: '#808080' },
      Badger: { border: '#808080', fill: '#000000' },
      Dragonfly: { border: '#00008B', fill: '#FFFF00' },
      Falcon: { border: '#228B22', fill: '#808080' },
      Sparrow: { border: '#F0E68C', fill: '#000000' },
      Tortoise: { border: '#000033', fill: '#FFFF00' },
      Mantis: { border: '#006400', fill: '#90EE90' },
      Shadowlands: { border: '#000000', fill: '#444444' },
      'Minor Clan': { border: '#808080', fill: '#B0B0B0' }
    };
    this.travelPapers = Object.fromEntries(Object.keys(this.clanColors).filter((clan) => clan !== 'Shadowlands').map((clan) => [clan, true]));
    this.avoidClans = {};

    this.mapImage = new Image();
    this.mapImage.onload = () => {
      this.mapWidth = this.mapImage.naturalWidth;
      this.mapHeight = this.mapImage.naturalHeight;
      this.applyZoom();
    };
    this.mapImage.src = imageSrc;

    this.farmImage = new Image();
    this.farmImage.onload = () => this.render();
    this.farmImage.src = '../img/map/farm.png';

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
      settlements: parsed.settlements || {},
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
        prob: numOrNull(entry.Probability),
        probRoad: numOrNull(entry['Probability with road']),
        skill: (entry.Skill || '').toLowerCase(),
        tn: numOrNull(entry.TN),
        tnRoad: numOrNull(entry['TN with road']),
        zeni: numOrNull(entry['Cost Zeni']),
        zeniRoad: numOrNull(entry['Cost Zeni with road'])
      };
    }
  }

  setViewMode(mode) { this.viewMode = mode; this.render(); }

  setSettlementLanguage(language) {
    if (!['english', 'rokugani'].includes(language)) return;
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

  cellTerrain(cx, cy) { return this.layers.terrain[`${cx},${cy}`] || null; }
  cellClan(cx, cy) { return this.layers.clans[`${cx},${cy}`] || null; }
  cellHasRoad(cx, cy) { return Object.prototype.hasOwnProperty.call(this.layers.infrastructure, `${cx},${cy}`); }

  // Costs, skill, TN, zeni and check probability for entering a tile.
  // Bridges (roads on water tiles) apply only when the traveller is on foot; boats/swimmers ignore them.
  tileData(cx, cy, mode) {
    const terrain = this.cellTerrain(cx, cy);
    if (!terrain) return null;
    const data = this.terrainCosts[terrain.toLowerCase()];
    if (!data) return null;
    const isWater = WATER_TERRAINS.has(terrain);
    const hasRoad = this.cellHasRoad(cx, cy) && (!isWater || mode === 'foot');
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
    const el = document.getElementById('pathSummary');
    const eventTable = document.getElementById('pathEvents');
    if (!el) return;
    if (!this.pathResult) {
      el.textContent = this.startCell
        ? 'Start selected — click waypoints; the last click is the destination.'
        : 'Click a starting tile.';
      if (eventTable) eventTable.hidden = true;
      return;
    }
    if (this.pathResult.failed) {
      const segNote = this.pathResult.failedSegment != null ? ` between waypoints ${this.pathResult.failedSegment - 1} and ${this.pathResult.failedSegment}` : '';
      el.textContent = `No route found${segNote}.`;
      if (eventTable) eventTable.hidden = true;
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
    if (eventTable) {
      const rows = this.pathResult.events.map((event) =>
        `<tr><td>${event.day}</td><td>${event.coord}</td><td>${event.event}</td><td>${event.mode}</td>` +
        `<td>${event.terrain}</td><td>${event.clan}</td><td>${event.skill}</td><td>${event.tn}</td>` +
        `<td>${event.result}</td><td>${event.cost}</td></tr>`
      ).join('');
      eventTable.querySelector('tbody').innerHTML = rows;
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
        const colors = this.clanColors[clan];
        if (!colors) continue;
        const polygons = this.traceClanPolygons(cells);
        if (!polygons.length) continue;
        this.drawClanShape(cells, polygons, colors, fillAlpha);
      }
    }

    for (const key of Object.keys(this.layers.infrastructure)) {
      const [x, y] = key.split(',').map(Number);
      this.drawRoad(x, y);
    }

    this.drawSettlements();

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

  drawSettlements() {
    Object.entries(this.layers.settlements).forEach(([key, settlement]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawSettlement(x, y, settlement);
    });
  }

  drawSettlement(x, y, settlement) {
    const { type, englishName = '', rokuganiName = '' } = settlement;
    const size = this.gridSize;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;
    const clan = settlement.clan || this.layers.clans[`${x},${y}`];
    const clanColors = this.clanColors[clan] || { border: '#444444', fill: '#DDDDDD' };
    const neutralColors = { Mine: '#4B4B4B', 'Lumber Mill': '#8B5A2B' };
    const isNeutral = type in neutralColors;
    const fillColor = neutralColors[type] || clanColors.fill;
    const borderColor = isNeutral ? '#222222' : clanColors.border;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 / this.zoom;

    if (type === 'Village' || type === 'City' || type === 'Capital') {
      ctx.beginPath();
      ctx.arc(cx, cy, type === 'Village' ? 3 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (type === 'Capital') {
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'Fortification' || type === 'Castle' || type === 'Kyuden') {
      const side = type === 'Fortification' ? 6 : 10;
      ctx.fillRect(cx - side / 2, cy - side / 2, side, side);
      ctx.strokeRect(cx - side / 2, cy - side / 2, side, side);
      if (type === 'Kyuden') {
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (type === 'Fortification') this.drawFortificationConnections(x, y, cx, cy, borderColor);
    } else if (type === 'Mine') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx - 5, cy + 4);
      ctx.lineTo(cx + 5, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'Lumber Mill') {
      for (let row = -1; row <= 1; row++) ctx.fillRect(cx - 5, cy + row * 4 - 1, 10, 2);
    } else if (type === 'Farm' && this.farmImage.complete && this.farmImage.naturalWidth) {
      ctx.drawImage(this.farmImage, cx - 6, cy - 6, 12, 12);
    }
    ctx.restore();

    const name = this.settlementLanguage === 'english' ? englishName : rokuganiName;
    const label = this.settlementLanguage === 'english' ? this.englishSettlementType(type) : this.rokuganiSettlementType(type);
    if (name) {
      const fontSize = this.settlementFontSize(type);
      this.drawMapText(name, cx, cy + size / 2 + fontSize / 2, fontSize);
      this.drawMapText(label, cx, cy + size / 2 + fontSize * 1.5, fontSize);
    }
  }

  drawFortificationConnections(x, y, cx, cy, color) {
    const ctx = this.ctx;
    const neighbours = [[1, 0], [0, 1], [1, 1], [1, -1]];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / this.zoom;
    ctx.lineCap = 'round';
    ctx.beginPath();
    neighbours.forEach(([dx, dy]) => {
      const neighbour = this.layers.settlements[`${x + dx},${y + dy}`];
      if (neighbour?.type !== 'Fortification') return;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
    });
    ctx.stroke();
    ctx.restore();
  }

  settlementFontSize(type) {
    return { Village: 8, City: 10, Capital: 12, Fortification: 8, Castle: 10, Kyuden: 12, Mine: 8, 'Lumber Mill': 8, Farm: 8 }[type] || 8;
  }

  englishSettlementType(type) {
    return type === 'Kyuden' ? 'Palace' : type;
  }

  rokuganiSettlementType(type) {
    return { Village: 'Mura', City: 'Toshi', Capital: 'Shuto', Fortification: '', Castle: 'Shiro', Kyuden: 'Kyuden', Mine: 'Kōzan', 'Lumber Mill': 'Seizaijo', Farm: 'Nōjō' }[type] || type;
  }

  drawMapText(text, x, y, fontSize) {
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = Math.max(2, fontSize / 6);
    this.ctx.strokeText(text, x, y);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(text, x, y);
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

  drawClanShape(cells, polygons, colors, fillAlpha) {
    const size = this.gridSize;
    this.ctx.save();
    this.ctx.globalAlpha = fillAlpha;
    this.ctx.fillStyle = colors.fill;
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
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = 12 / this.zoom;
    this.ctx.stroke(stroke);
    this.ctx.strokeStyle = colors.fill;
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
