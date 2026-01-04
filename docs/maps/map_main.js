import HexMap from '../js/map/HexMap.js';
import LowResTileSet from '../js/map/LowResTileSet.js';
import HexMapGenerator from '../js/map/HexMapGenerator.js';

// Initialize the hex map
const mapWidth = 64;
const mapHeight = 48;
const hexWidth = 32;
const hexHeight = 30;

const hexMap = new HexMap('mapCanvas', mapWidth, mapHeight, hexWidth, hexHeight);

const lowResTileSet = new LowResTileSet();
const generator = new HexMapGenerator(lowResTileSet);
generator.generate(hexMap);

lowResTileSet.tileSet.image.onload = function() {
    // Start rendering
    hexMap.animate();
}

// Handle image load error
lowResTileSet.tileSet.image.onerror = function() {
    const warning = document.getElementById('warning');
    warning.classList.add('show');
};