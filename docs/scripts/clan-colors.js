import { CLAN } from "./world-map-layers.js";

const colorsByClan = new Map([
  [CLAN.NONE, { border: null, fill: null }],
  [CLAN.CRAB, { border: "#00008B", fill: "#808080" }],
  [CLAN.CRANE, { border: "#87CEEB", fill: "#FFFFFF" }],
  [CLAN.DRAGON, { border: "#228B22", fill: "#FFFF00" }],
  [CLAN.LION, { border: "#8B4513", fill: "#D4A017" }],
  [CLAN.PHOENIX, { border: "#FFD700", fill: "#FFA500" }],
  [CLAN.SCORPION, { border: "#FF0000", fill: "#000000" }],
  [CLAN.UNICORN, { border: "#800080", fill: "#FFFF00" }],
  [CLAN.IMPERIAL, { border: "#D4AF37", fill: "#FFFFFF" }],
  [CLAN.HARE, { border: "#FF0000", fill: "#FFFFFF" }],
  [CLAN.CENTIPEDE, { border: "#FFA500", fill: "#8B4513" }],
  [CLAN.FOX, { border: "#C4A484", fill: "#808080" }],
  [CLAN.BADGER, { border: "#808080", fill: "#000000" }],
  [CLAN.DRAGONFLY, { border: "#00008B", fill: "#FFFF00" }],
  [CLAN.FALCON, { border: "#228B22", fill: "#808080" }],
  [CLAN.SPARROW, { border: "#F0E68C", fill: "#000000" }],
  [CLAN.TORTOISE, { border: "#000033", fill: "#FFFF00" }],
  [CLAN.MANTIS, { border: "#006400", fill: "#90EE90" }],
  [CLAN.SHADOWLANDS, { border: "#000000", fill: "#444444" }],
]);

for (const colors of colorsByClan.values()) Object.freeze(colors);

export function getClanColors(clan) {
  if (!colorsByClan.has(clan)) {
    throw new TypeError("Clan colors require a clan metadata value.");
  }
  return colorsByClan.get(clan);
}