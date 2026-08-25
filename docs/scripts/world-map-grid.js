class WorldMapGrid {
  constructor(mapImageSelector, canvasSelector) {
    this.mapImage = document.querySelector(mapImageSelector);
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 64;
    
    // Layer data structure: { terrain: {}, clans: {}, infrastructure: {}, text: {} }
    this.layers = {
      terrain: {},
      clans: {},
      infrastructure: {},
      text: {}
    };
    
    // Current tool and layer
    this.currentTool = null;
    this.currentLayer = 'terrain';
    this.currentValue = null;
    this.fontSize = 16;
    this.isDrawing = false;
    
    // Color definitions
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
    
    this.roadPatterns = [
      { name: '0° (Horizontal)', angle: 0, length: 64 },
      { name: '45°', angle: 45, length: 64 },
      { name: '90° (Vertical)', angle: 90, length: 64 },
      { name: '135°', angle: 135, length: 64 },
      { name: '0° (Top to Center)', angle: 0, length: 32, startY: -16 },
      { name: '45° (Top-Right)', angle: 45, length: 32, startX: 16, startY: -16 },
      { name: '90° (Right to Center)', angle: 90, length: 32, startX: 16 },
      { name: '135° (Bottom-Right)', angle: 135, length: 32, startX: 16, startY: 16 },
      { name: '180° (Bottom to Center)', angle: 180, length: 32, startY: 16 },
      { name: '225° (Bottom-Left)', angle: 225, length: 32, startX: -16, startY: 16 },
      { name: '270° (Left to Center)', angle: 270, length: 32, startX: -16 },
      { name: '315° (Top-Left)', angle: 315, length: 32, startX: -16, startY: -16 }
    ];
    
    this.setupCanvas();
    this.setupEventListeners();
    this.draw();
  }
  
  setupCanvas() {
    this.mapImage.onload = () => {
      this.canvas.width = this.mapImage.width;
      this.canvas.height = this.mapImage.height;
      this.draw();
    };
    
    if (this.mapImage.complete) {
      this.canvas.width = this.mapImage.width;
      this.canvas.height = this.mapImage.height;
    }
  }
  
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
  }
  
  getGridCell(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (x - rect.left) * (this.canvas.width / rect.width);
    const canvasY = (y - rect.top) * (this.canvas.height / rect.height);
    
    const cellX = Math.floor(canvasX / this.gridSize);
    const cellY = Math.floor(canvasY / this.gridSize);
    
    return { x: cellX, y: cellY, canvasX, canvasY };
  }
  
  getCellKey(x, y) {
    return `${x},${y}`;
  }
  
  onCanvasMouseDown(e) {
    this.isDrawing = true;
    if (this.currentTool) {
      const { x, y } = this.getGridCell(e.clientX, e.clientY);
      this.paintCell(x, y);
    }
  }
  
  onCanvasMouseMove(e) {
    if (this.isDrawing && this.currentTool) {
      const { x, y } = this.getGridCell(e.clientX, e.clientY);
      this.paintCell(x, y);
    }
  }
  
  paintCell(x, y) {
    const key = this.getCellKey(x, y);
    
    if (this.currentLayer === 'text') {
      // Text is handled differently
      this.showTextInput(x, y);
      return;
    }
    
    if (this.currentLayer === 'terrain') {
      this.layers.terrain[key] = this.currentValue;
    } else if (this.currentLayer === 'clans') {
      this.layers.clans[key] = this.currentValue;
    } else if (this.currentLayer === 'infrastructure') {
      this.layers.infrastructure[key] = this.currentValue;
    }
    
    this.draw();
  }
  
  showTextInput(x, y) {
    const text = prompt('Enter text:');
    if (text) {
      const key = this.getCellKey(x, y);
      this.layers.text[key] = {
        text: text,
        fontSize: this.fontSize
      };
      this.isDrawing = false;
      this.draw();
    }
  }
  
  selectTool(tool, value, layer) {
    this.currentTool = tool;
    this.currentValue = value;
    this.currentLayer = layer;
  }
  
  setFontSize(size) {
    this.fontSize = size;
  }
  
  clearCell(x, y) {
    const key = this.getCellKey(x, y);
    if (this.currentLayer === 'terrain') {
      delete this.layers.terrain[key];
    } else if (this.currentLayer === 'clans') {
      delete this.layers.clans[key];
    } else if (this.currentLayer === 'infrastructure') {
      delete this.layers.infrastructure[key];
    } else if (this.currentLayer === 'text') {
      delete this.layers.text[key];
    }
    this.draw();
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw terrain layer
    Object.entries(this.layers.terrain).forEach(([key, terrain]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawCellBorder(x, y, this.terrainColors[terrain], 2);
    });
    
    // Draw clan layer
    Object.entries(this.layers.clans).forEach(([key, clan]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawCellBorder(x, y, this.clanColors[clan], 3);
    });
    
    // Draw infrastructure layer
    Object.entries(this.layers.infrastructure).forEach(([key, roadPattern]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawRoad(x, y, roadPattern);
    });
    
    // Draw text layer (on top of everything)
    Object.entries(this.layers.text).forEach(([key, data]) => {
      const [x, y] = key.split(',').map(Number);
      this.drawText(x, y, data.text, data.fontSize);
    });
    
    // Draw grid lines
    this.drawGrid();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  drawCellBorder(x, y, color, lineWidth) {
    const px = x * this.gridSize;
    const py = y * this.gridSize;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(px, py, this.gridSize, this.gridSize);
  }
  
  drawRoad(x, y, patternIndex) {
    const pattern = this.roadPatterns[patternIndex];
    const centerX = (x * this.gridSize) + (this.gridSize / 2);
    const centerY = (y * this.gridSize) + (this.gridSize / 2);
    
    const startX = pattern.startX || 0;
    const startY = pattern.startY || 0;
    
    const angle = (pattern.angle * Math.PI) / 180;
    const length = pattern.length;
    
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + startX, centerY + startY);
    this.ctx.lineTo(centerX + endX, centerY + endY);
    this.ctx.stroke();
  }
  
  drawText(x, y, text, fontSize) {
    const px = (x * this.gridSize) + (this.gridSize / 2);
    const py = (y * this.gridSize) + (this.gridSize / 2);
    
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw text with white outline for better readability
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(text, px, py);
    this.ctx.fillText(text, px, py);
  }
  
  saveToJSON() {
    return JSON.stringify(this.layers, null, 2);
  }
  
  loadFromJSON(jsonString) {
    try {
      this.layers = JSON.parse(jsonString);
      this.draw();
      return true;
    } catch (e) {
      console.error('Failed to load JSON:', e);
      return false;
    }
  }
  
  exportToFile() {
    const json = this.saveToJSON();
    const blob = new Blob([json], { type: 'application/json' });
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
      if (this.loadFromJSON(e.target.result)) {
        alert('Map loaded successfully!');
      } else {
        alert('Failed to load map. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }
  
  clearAllLayers() {
    if (confirm('Are you sure you want to clear all layers?')) {
      this.layers = {
        terrain: {},
        clans: {},
        infrastructure: {},
        text: {}
      };
      this.draw();
    }
  }
}

// Initialize on page load
let mapGrid;
document.addEventListener('DOMContentLoaded', () => {
  const mapImage = document.querySelector('#worldMap');
  const canvas = document.querySelector('#mapCanvas');
  
  if (mapImage && canvas) {
    mapGrid = new WorldMapGrid('#worldMap', '#mapCanvas');
  }
});
