import { SETTLEMENT } from "./world-map-layers.js";

const settlementAssetEntries = [
  [SETTLEMENT.SMALL_SHRINE, "../img/map/shrine.png"],
  [SETTLEMENT.LARGE_SHRINE, "../img/map/shrine.png"],
  [SETTLEMENT.SMALL_TEMPLE, "../img/map/temple.webp"],
  [SETTLEMENT.LARGE_TEMPLE, "../img/map/temple.webp"],
];
const settlementAssetMap = new Map(settlementAssetEntries);

export const SETTLEMENT_ASSETS = Object.freeze(settlementAssetEntries.map(
  ([settlement, image]) => Object.freeze({ settlement, image }),
));
export const SETTLEMENT_CONTROL_IMAGES = Object.freeze({});
export const NEUTRAL_SETTLEMENT_COLORS = Object.freeze({ border: "#444444", fill: "#DDDDDD" });

export function getSettlementAsset(settlement) {
  if (!Object.values(SETTLEMENT).includes(settlement)) {
    throw new TypeError("Settlement asset lookup requires a settlement metadata value.");
  }
  return settlementAssetMap.get(settlement);
}

export function drawCircularSettlement(ctx, settlement, centerX, centerY, zoom, clanColors) {
  if (!ctx || !Number.isFinite(centerX) || !Number.isFinite(centerY) || !Number.isFinite(zoom) || zoom <= 0) {
    throw new TypeError("Settlement drawing needs a canvas context and valid coordinates and zoom.");
  }
  if (!Object.values(SETTLEMENT).includes(settlement)) {
    throw new TypeError("Settlement drawing needs a settlement metadata value.");
  }
  const colors = clanColors || NEUTRAL_SETTLEMENT_COLORS;
  const fill = colors.fill || NEUTRAL_SETTLEMENT_COLORS.fill;
  const border = colors.border || NEUTRAL_SETTLEMENT_COLORS.border;
  const radius = settlement === SETTLEMENT.VILLAGE || settlement === SETTLEMENT.VILLAGE_RUINS ? 3 : 5;
  if (![SETTLEMENT.VILLAGE, SETTLEMENT.CITY, SETTLEMENT.CAPITAL, SETTLEMENT.VILLAGE_RUINS].includes(settlement)) {
    return false;
  }

  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (settlement === SETTLEMENT.CAPITAL) {
    ctx.fillStyle = border;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (settlement === SETTLEMENT.VILLAGE_RUINS) {
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY + 4);
    ctx.lineTo(centerX + 4, centerY - 4);
    ctx.stroke();
  }
  ctx.restore();
  return true;
}

export function drawSquareSettlement(ctx, settlement, centerX, centerY, zoom, clanColors) {
  if (!ctx || !Number.isFinite(centerX) || !Number.isFinite(centerY) || !Number.isFinite(zoom) || zoom <= 0) {
    throw new TypeError("Settlement drawing needs a canvas context and valid coordinates and zoom.");
  }
  if (!Object.values(SETTLEMENT).includes(settlement)) {
    throw new TypeError("Settlement drawing needs a settlement metadata value.");
  }
  const supported = [
    SETTLEMENT.FORTIFICATION, SETTLEMENT.CASTLE, SETTLEMENT.KYUDEN,
    SETTLEMENT.CASTLE_RUINS, SETTLEMENT.ACADEMY, SETTLEMENT.WATCHTOWER,
  ];
  if (!supported.includes(settlement)) return false;

  const colors = clanColors || NEUTRAL_SETTLEMENT_COLORS;
  const fill = colors.fill || NEUTRAL_SETTLEMENT_COLORS.fill;
  const border = colors.border || NEUTRAL_SETTLEMENT_COLORS.border;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1 / zoom;

  if (settlement === SETTLEMENT.WATCHTOWER) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 5);
    ctx.lineTo(centerX + 4, centerY - 1);
    ctx.lineTo(centerX - 4, centerY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(centerX - 2.5, centerY - 1, 5, 6);
    ctx.strokeRect(centerX - 2.5, centerY - 1, 5, 6);
  } else {
    const side = settlement === SETTLEMENT.FORTIFICATION ? 6 : 10;
    ctx.fillRect(centerX - side / 2, centerY - side / 2, side, side);
    ctx.strokeRect(centerX - side / 2, centerY - side / 2, side, side);
    if (settlement === SETTLEMENT.KYUDEN) {
      ctx.fillStyle = border;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (settlement === SETTLEMENT.CASTLE_RUINS) {
      ctx.beginPath();
      ctx.moveTo(centerX - 5, centerY + 5);
      ctx.lineTo(centerX + 5, centerY - 5);
      ctx.stroke();
    } else if (settlement === SETTLEMENT.ACADEMY) {
      ctx.fillStyle = border;
      ctx.font = `${6 / zoom}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", centerX, centerY);
    }
  }
  ctx.restore();
  return true;
}

const settlementLabelEntries = [
  [SETTLEMENT.VILLAGE, 6], [SETTLEMENT.CITY, 8], [SETTLEMENT.CAPITAL, 10],
  [SETTLEMENT.FORTIFICATION, 6], [SETTLEMENT.CASTLE, 8], [SETTLEMENT.KYUDEN, 10],
  [SETTLEMENT.SMALL_SHRINE, 6], [SETTLEMENT.LARGE_SHRINE, 8],
  [SETTLEMENT.VILLAGE_RUINS, 6], [SETTLEMENT.CASTLE_RUINS, 8],
  [SETTLEMENT.ACADEMY, 6], [SETTLEMENT.WATCHTOWER, 6],
  [SETTLEMENT.SMALL_TEMPLE, 6], [SETTLEMENT.LARGE_TEMPLE, 8],
];
const settlementLabelSizeMap = new Map(settlementLabelEntries);

export const SETTLEMENT_LABEL_SIZES = Object.freeze(settlementLabelEntries.map(
  ([settlement, size]) => Object.freeze({ settlement, size }),
));

export function getSettlementLabelSize(settlement) {
  if (!Object.values(SETTLEMENT).includes(settlement)) {
    throw new TypeError("Settlement label lookup requires a settlement metadata value.");
  }
  return settlementLabelSizeMap.get(settlement) || 6;
}

export function drawShrine(ctx, source, centerX, centerY, color, scale, tintedIconCache) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new TypeError("Shrine drawing needs a positive image scale.");
  }
  if (!source || !source.complete || !source.naturalWidth) return false;
  const width = Math.round(source.naturalWidth * scale);
  const height = Math.round(source.naturalHeight * scale);
  return drawTintedAsset(ctx, source, centerX, centerY, color, width, height, tintedIconCache);
}

export function drawTemple(ctx, source, centerX, centerY, color, size, tintedIconCache) {
  if (!Number.isFinite(size) || size <= 0) {
    throw new TypeError("Temple drawing needs a positive image size.");
  }
  if (!source || !source.complete || !source.naturalWidth) return false;
  return drawTintedAsset(ctx, source, centerX, centerY, color, size, size, tintedIconCache);
}

export function drawSettlementAsset(ctx, settlement, source, centerX, centerY, color, tintedIconCache) {
  if (settlement === SETTLEMENT.SMALL_SHRINE) {
    return drawShrine(ctx, source, centerX, centerY, color, 0.75, tintedIconCache);
  }
  if (settlement === SETTLEMENT.LARGE_SHRINE) {
    return drawShrine(ctx, source, centerX, centerY, color, 1, tintedIconCache);
  }
  if (settlement === SETTLEMENT.SMALL_TEMPLE) {
    return drawTemple(ctx, source, centerX, centerY, color, 12, tintedIconCache);
  }
  if (settlement === SETTLEMENT.LARGE_TEMPLE) {
    return drawTemple(ctx, source, centerX, centerY, color, 16, tintedIconCache);
  }
  if (!Object.values(SETTLEMENT).includes(settlement)) {
    throw new TypeError("Settlement asset drawing needs a settlement metadata value.");
  }
  return false;
}

export function drawSettlementMarker(ctx, settlement, source, centerX, centerY, zoom, clanColors, tintedIconCache) {
  const asset = getSettlementAsset(settlement);
  if (asset) {
    const colors = clanColors || NEUTRAL_SETTLEMENT_COLORS;
    return drawSettlementAsset(ctx, settlement, source, centerX, centerY, colors.border, tintedIconCache);
  }
  if (drawCircularSettlement(ctx, settlement, centerX, centerY, zoom, clanColors)) return true;
  return drawSquareSettlement(ctx, settlement, centerX, centerY, zoom, clanColors);
}

function drawTintedAsset(ctx, source, centerX, centerY, color, width, height, tintedIconCache) {
  if (!ctx || typeof color !== "string" || !tintedIconCache || typeof tintedIconCache !== "object") {
    throw new TypeError("Tinted settlement drawing needs a canvas context, color, and cache.");
  }
  const key = [source.src, color, width, height].join(":");
  let image = tintedIconCache[key];
  if (!image) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(source, 0, 0, width, height);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    tintedIconCache[key] = image = canvas;
  }
  ctx.drawImage(image, centerX - width / 2, centerY - height / 2);
  return true;
}