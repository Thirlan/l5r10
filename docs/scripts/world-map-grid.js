const DEFAULT_GRID_SIZE = 16;

class WorldMapGrid {
  constructor(imageSrc, canvasSelector, gridSize = DEFAULT_GRID_SIZE) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : DEFAULT_GRID_SIZE;
    this.zoom = 0.35;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layers = {
      terrain: {},
      clans: {},
      infrastructure: {},
      settlements: {},
      text: {}
    };

    this.currentLayer = 'terrain';
    this.currentValue = null;
    this.fontSize = 16;
    this.settlementLanguage = 'english';
    this.brushSize = 1;
    this.isDrawing = false;

    this.terrainColors = {
      Mountain: '#8B7355',
      'Coastal Water': '#4169E1',
      Water: '#1E90FF',
      Forest: '#228B22',
      Plains: '#90EE90',
      Hills: '#DAA520',
      Deserts: '#F4A460',
      Marsh: '#556B2F',
      Ocean: '#00008B',
      Waste: '#777777',
      Snow: '#F0F8FF',
      City: '#FF6347'
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

    this.infrastructureStyles = {
      Road: { color: '#5C3A1E', lineWidth: 3, markerRadius: 2 },
      Footpath: { color: '#A97443', lineWidth: 1.5, markerRadius: 1.5 }
    };
    this.shrineIconCache = {};

    this.mapImage = new Image();
    this.mapImage.onload = () => {
      this.mapWidth = this.mapImage.naturalWidth;
      this.mapHeight = this.mapImage.naturalHeight;
      this.applyZoom();
    };
    this.mapImage.src = imageSrc;

    this.terrainImages = this.loadTerrainImages(() => this.draw());

    this.farmImage = new Image();
    this.farmImage.onload = () => this.draw();
    this.farmImage.src = '../img/map/farm.png';

    this.mineImage = new Image();
    this.mineImage.onload = () => this.draw();
    this.mineImage.src = '../img/map/mine.png';

    this.shrineImage = new Image();
    this.shrineImage.onload = () => this.draw();
    this.shrineImage.src = '../img/map/shrine.png';

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      this.paintAt(e);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDrawing) this.paintAt(e);
    });
    this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cell = this.getGridCell(e);
      this.clearCell(cell.x, cell.y);
    });
    this.canvas.addEventListener('wheel', (e) => {
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
    return `${x},${y}`;
  }

  paintAt(event) {
    if (!this.currentLayer) return;
    const { x, y } = this.getGridCell(event);
    if (x < 0 || y < 0) return;

    if (this.currentLayer === 'text') {
      const textEntry = this.createTextEntry();
      if (textEntry.englishText || textEntry.rokuganiText) this.layers.text[this.getCellKey(x, y)] = textEntry;
      this.draw();
      return;
    }

    if (this.currentLayer !== 'erase' && this.currentValue === null) return;

    this.brushCells(x, y).forEach(([cx, cy]) => {
      const key = this.getCellKey(cx, cy);
      if (this.currentLayer === 'erase') {
        // currentValue names a single layer to erase, or null to erase them all.
        const targets = this.currentValue ? [this.layers[this.currentValue]] : Object.values(this.layers);
        targets.forEach((layer) => delete layer[key]);
      } else if (this.currentLayer === 'settlements') {
        this.layers.settlements[key] = this.createSettlement(this.currentValue);
      } else {
        this.layers[this.currentLayer][key] = this.currentValue;
      }
    });
    this.draw();
  }

  // Odd brush sizes centre on the cursor; even ones extend right and down.
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

  selectTool(_tool, value, layer) {
    this.currentValue = value;
    this.currentLayer = layer;
  }

  setFontSize(size) {
    this.fontSize = Number(size);
  }

  setSettlementLanguage(language) {
    if (!['english', 'rokugani'].includes(language)) return;
    this.settlementLanguage = language;
    this.draw();
  }

  createSettlement(type) {
    return {
      type,
      englishName: document.getElementById('settlementEnglishName').value.trim(),
      rokuganiName: document.getElementById('settlementRokuganiName').value.trim()
    };
  }

  createTextEntry() {
    return {
      englishText: document.getElementById('textEnglish').value.trim(),
      rokuganiText: document.getElementById('textRokugani').value.trim(),
      fontSize: Number(this.fontSize)
    };
  }

  setZoom(zoom) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    this.applyZoom();
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.25);
  }

  zoomOut() {
    this.setZoom(this.zoom / 1.25);
  }

  resetZoom() {
    this.setZoom(1);
  }

  fitToWidth() {
    const available = this.canvas.parentElement.clientWidth;
    if (available && this.mapWidth) this.setZoom(available / this.mapWidth);
  }

  applyZoom() {
    if (!this.mapWidth) return;
    this.canvas.width = Math.round(this.mapWidth * this.zoom);
    this.canvas.height = Math.round(this.mapHeight * this.zoom);
    this.draw();
    const label = document.getElementById('zoomLevel');
    if (label) label.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  clearCell(x, y) {
    delete this.layers[this.currentLayer][this.getCellKey(x, y)];
    this.draw();
  }

  draw() {
    if (!this.mapWidth) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(this.zoom, this.zoom);

    ctx.drawImage(this.mapImage, 0, 0, this.mapWidth, this.mapHeight);

    Object.entries(this.layers.terrain).forEach(([key, terrain]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawTerrainCell(x, y, terrain);
    });

    this.drawClanBoundaries();

    Object.entries(this.layers.infrastructure).forEach(([key, infrastructure]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawInfrastructure(x, y, infrastructure);
    });

    this.drawSettlements();

    this.drawGrid();

    Object.entries(this.layers.text).forEach(([key, data]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawText(x, y, this.textContent(data), data.fontSize);
    });
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
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

  fillCell(x, y, color) {
    if (!color) return;
    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
    this.ctx.restore();
  }

  loadTerrainImages(onLoad) {
    const filenames = {
      Plains: 'plain.png',
      Water: 'water.png',
      Deserts: 'desert.png',
      'Coastal Water': 'coastal_water.png',
      Ocean: 'ocean.png',
      Waste: 'waste.png'
    };
    return Object.fromEntries(Object.entries(filenames).map(([terrain, filename]) => {
      const image = new Image();
      image.onload = onLoad;
      image.src = `../img/map/${filename}`;
      return [terrain, image];
    }));
  }

  drawTerrainCell(x, y, terrain) {
    const image = this.terrainImages[terrain];
    if (image?.complete && image.naturalWidth) {
      this.ctx.drawImage(image, x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
      return;
    }
    this.fillCell(x, y, this.terrainColors[terrain]);
  }

  drawClanBoundaries() {
    const cellsByClan = {};
    for (const [key, clan] of Object.entries(this.layers.clans)) {
      if (!cellsByClan[clan]) cellsByClan[clan] = new Set();
      cellsByClan[clan].add(key);
    }

    const size = this.gridSize;

    for (const [clan, cells] of Object.entries(cellsByClan)) {
      const colors = this.clanColors[clan];
      if (!colors) continue;
      const polygons = this.traceClanPolygons(cells);
      if (!polygons.length) continue;

      this.ctx.save();
      this.ctx.lineJoin = 'miter';
      this.ctx.lineCap = 'square';

      // Clip to the clan's cells so strokes on the boundary path only paint the inside half.
      const clip = new Path2D();
      for (const key of cells) {
        const [cx, cy] = key.split(',').map(Number);
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

      // Neutral edge is drawn last and narrowest so shared boundaries are draw-order independent.
      this.ctx.strokeStyle = '#444444';
      this.ctx.lineWidth = 2 / this.zoom;
      this.ctx.stroke(strokePath);

      this.ctx.restore();
    }
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

  // Mixes 55% toward white, or toward dark grey when the source is already very light (Imperial).
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

  drawInfrastructure(x, y, infrastructure) {
    const style = this.infrastructureStyles[infrastructure] || this.infrastructureStyles.Road;
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    this.ctx.strokeStyle = style.color;
    this.ctx.fillStyle = style.color;
    this.ctx.lineWidth = style.lineWidth;
    this.ctx.lineCap = 'round';

    // Only forward neighbours, so each connection is drawn once.
    const forward = [[1, 0], [0, 1], [1, 1], [1, -1]];
    forward.forEach(([dx, dy]) => {
      const neighbour = this.layers.infrastructure[this.getCellKey(x + dx, y + dy)];
      if (!neighbour) return;
      const neighbourStyle = this.infrastructureStyles[neighbour] || this.infrastructureStyles.Road;
      const segmentStyle = style.lineWidth <= neighbourStyle.lineWidth ? style : neighbourStyle;
      this.ctx.strokeStyle = segmentStyle.color;
      this.ctx.lineWidth = segmentStyle.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
      this.ctx.stroke();
    });

    const isolated = forward
      .flatMap(([dx, dy]) => [[dx, dy], [-dx, -dy]])
      .every(([dx, dy]) => !this.layers.infrastructure[this.getCellKey(x + dx, y + dy)]);

    if (isolated) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, style.markerRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawSettlements() {
    Object.entries(this.layers.settlements).forEach(([key, settlement]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawSettlementMarker(x, y, settlement);
    });
    Object.entries(this.layers.settlements).forEach(([key, settlement]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawSettlementText(x, y, settlement);
    });
  }

  drawSettlementMarker(x, y, settlement) {
    const { type } = settlement;
    const size = this.gridSize;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;
    const clan = this.layers.clans[this.getCellKey(x, y)];
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
    } else if (type === 'Mine' && this.mineImage.complete && this.mineImage.naturalWidth) {
      ctx.drawImage(this.mineImage, cx - 6, cy - 6, 12, 12);
    } else if (type === 'Lumber Mill') {
      for (let row = -1; row <= 1; row++) ctx.fillRect(cx - 5, cy + row * 4 - 1, 10, 2);
    } else if (type === 'Farm' && this.farmImage.complete && this.farmImage.naturalWidth) {
      ctx.drawImage(this.farmImage, cx - 6, cy - 6, 12, 12);
    } else if (type === 'Small Shrine' || type === 'Large Shrine') {
      this.drawShrine(cx, cy, clanColors.border, type === 'Small Shrine' ? 0.75 : 1);
    }
    ctx.restore();
  }

  drawSettlementText(x, y, settlement) {
    const { type, englishName = '', rokuganiName = '' } = settlement;
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    const name = this.settlementLanguage === 'english' ? englishName : rokuganiName;
    const label = this.settlementLanguage === 'english' ? this.englishSettlementType(type) : this.rokuganiSettlementType(type);
    this.drawSettlementLabel(cx, cy, label, name, this.settlementFontSize(type));
  }

  drawShrine(cx, cy, color, scale) {
    if (!this.shrineImage.complete || !this.shrineImage.naturalWidth) return;
    const image = this.shrineIcon(color, scale);
    this.ctx.drawImage(image, cx - image.width / 2, cy - image.height / 2);
  }

  shrineIcon(color, scale) {
    const key = `${color}:${scale}`;
    if (this.shrineIconCache[key]) return this.shrineIconCache[key];
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(this.shrineImage.naturalWidth * scale);
    canvas.height = Math.round(this.shrineImage.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.shrineImage, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.shrineIconCache[key] = canvas;
    return canvas;
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
      const neighbour = this.layers.settlements[this.getCellKey(x + dx, y + dy)];
      if (neighbour?.type !== 'Fortification') return;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
    });
    ctx.stroke();
    ctx.restore();
  }

  drawSettlementLabel(cx, cy, label, name, fontSize) {
    if (!name) return;
    this.drawMapText(name, cx, cy + this.gridSize / 2 + fontSize / 2, fontSize);
    if (label) this.drawMapText(label, cx, cy + this.gridSize / 2 + fontSize * 1.5, fontSize);
  }

  settlementFontSize(type) {
    return { Village: 8, City: 10, Capital: 12, Fortification: 8, Castle: 10, Kyuden: 12, Mine: 8, 'Lumber Mill': 8, Farm: 8, 'Small Shrine': 8, 'Large Shrine': 10 }[type] || 8;
  }

  englishSettlementType(type) {
    return type === 'Kyuden' ? 'Palace' : type;
  }

  rokuganiSettlementType(type) {
    return { Village: 'Mura', City: 'Toshi', Capital: 'Shuto', Fortification: '', Castle: 'Shiro', Kyuden: 'Kyuden', Mine: 'Kōzan', 'Lumber Mill': 'Seizaijo', Farm: 'Nōjō', 'Small Shrine': 'Shōsha', 'Large Shrine': 'Taisha' }[type] || type;
  }

  textContent(data) {
    if (typeof data === 'string') return data;
    return this.settlementLanguage === 'english'
      ? data.englishText || data.text || data.rokuganiText || ''
      : data.rokuganiText || data.text || data.englishText || '';
  }

  drawMapText(text, x, y, fontSize) {
    if (!text) return;
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
    if (!text) return;
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

  saveToJSON() {
    return JSON.stringify(this.layers, null, 2);
  }

  loadFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.layers = {
        terrain: parsed.terrain || {},
        clans: parsed.clans || {},
        infrastructure: parsed.infrastructure || {},
        settlements: parsed.settlements || {},
        text: parsed.text || {}
      };
      this.draw();
      return true;
    } catch (e) {
      console.error('Failed to load JSON:', e);
      return false;
    }
  }

  exportToFile() {
    const blob = new Blob([this.saveToJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world-map-grid.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!this.loadFromJSON(e.target.result)) {
        alert('Failed to load map. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  clearAllLayers() {
    if (confirm('Are you sure you want to clear all layers?')) {
      this.layers = { terrain: {}, clans: {}, infrastructure: {}, settlements: {}, text: {} };
      this.draw();
    }
  }
}

let mapGrid;
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#mapCanvas');
  if (canvas) {
    const gridSize = Number.parseInt(canvas.dataset.gridSize, 10);
    mapGrid = new WorldMapGrid(canvas.dataset.mapSrc, '#mapCanvas', gridSize);
  }
});
