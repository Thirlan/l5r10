const GRID_SIZE = 32;

class WorldMapGrid {
  constructor(imageSrc, canvasSelector) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = GRID_SIZE;
    this.zoom = 0.35;
    this.minZoom = 0.1;
    this.maxZoom = 4;

    this.layers = {
      terrain: {},
      clans: {},
      infrastructure: {},
      text: {}
    };

    this.currentLayer = 'terrain';
    this.currentValue = null;
    this.fontSize = 16;
    this.isDrawing = false;

    this.terrainColors = {
      Mountain: '#8B7355',
      Ocean: '#4169E1',
      River: '#1E90FF',
      Forest: '#228B22',
      Plains: '#90EE90',
      Hills: '#DAA520',
      Deserts: '#F4A460',
      Marsh: '#556B2F',
      Shadowlands: '#2F4F4F',
      'Deep Ocean': '#00008B',
      Snow: '#F0F8FF',
      City: '#FF6347'
    };

    this.clanColors = {
      Crane: '#87CEEB',
      Lion: '#8B4513',
      Crab: '#00008B',
      Dragon: '#90EE90',
      Unicorn: '#800080',
      Scorpion: '#FF0000',
      Imperial: '#FFFFFF',
      Shadowlands: '#000000',
      Phoenix: '#FFA500',
      Mantis: '#006400',
      'Minor Clan': '#808080'
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

    if (this.currentLayer === 'erase') {
      this.eraseCell(x, y);
      return;
    }

    if (this.currentLayer === 'text') {
      this.isDrawing = false;
      const text = prompt('Enter text:');
      if (text) {
        this.layers.text[this.getCellKey(x, y)] = { text, fontSize: Number(this.fontSize) };
        this.draw();
      }
      return;
    }

    if (this.currentValue === null) return;
    this.layers[this.currentLayer][this.getCellKey(x, y)] = this.currentValue;
    this.draw();
  }

  selectTool(_tool, value, layer) {
    this.currentValue = value;
    this.currentLayer = layer;
  }

  setFontSize(size) {
    this.fontSize = Number(size);
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

  eraseCell(x, y) {
    const key = this.getCellKey(x, y);
    Object.values(this.layers).forEach((layer) => delete layer[key]);
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
      this.fillCell(x, y, this.terrainColors[terrain]);
    });

    Object.entries(this.layers.clans).forEach(([key, clan]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawCellBorder(x, y, this.clanColors[clan]);
    });

    Object.entries(this.layers.infrastructure).forEach(([key]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawRoad(x, y);
    });

    this.drawGrid();

    Object.entries(this.layers.text).forEach(([key, data]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawText(x, y, data.text, data.fontSize);
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
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
  }

  drawCellBorder(x, y, color) {
    if (!color) return;
    const inset = 1;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      x * this.gridSize + inset,
      y * this.gridSize + inset,
      this.gridSize - inset * 2,
      this.gridSize - inset * 2
    );
  }

  drawRoad(x, y) {
    const cx = x * this.gridSize + this.gridSize / 2;
    const cy = y * this.gridSize + this.gridSize / 2;

    this.ctx.strokeStyle = '#5C3A1E';
    this.ctx.fillStyle = '#5C3A1E';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    // Only forward neighbours, so each connection is drawn once.
    const forward = [[1, 0], [0, 1], [1, 1], [1, -1]];
    forward.forEach(([dx, dy]) => {
      if (!(this.getCellKey(x + dx, y + dy) in this.layers.infrastructure)) return;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + dx * this.gridSize, cy + dy * this.gridSize);
      this.ctx.stroke();
    });

    const isolated = forward
      .flatMap(([dx, dy]) => [[dx, dy], [-dx, -dy]])
      .every(([dx, dy]) => !(this.getCellKey(x + dx, y + dy) in this.layers.infrastructure));

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
      this.layers = { terrain: {}, clans: {}, infrastructure: {}, text: {} };
      this.draw();
    }
  }
}

let mapGrid;
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#mapCanvas');
  if (canvas) {
    mapGrid = new WorldMapGrid(canvas.dataset.mapSrc, '#mapCanvas');
  }
});
