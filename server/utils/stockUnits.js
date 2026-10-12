const roundStock = (value) => Math.round((Number(value) || 0) * 1000000) / 1000000;

// Units where the printed number is a volume/weight (100 ML, 15 GM), not a count.
const MEASURE_UNITS = ['ML', 'LTR', 'GM', 'KG'];
const PACKING_UNITS = [
  ['ML', /(?:^|[^a-z])(ml|mls)(?![a-z])/i],
  ['LTR', /(?:^|[^a-z])(l|ltr|ltrs|litre|liter)(?![a-z])/i],
  ['KG', /(?:^|[^a-z])(kg|kgs)(?![a-z])/i],
  ['GM', /(?:^|[^a-z])(g|gm|gms|gram|grams)(?![a-z])/i],
  ['CAP', /(?:^|[^a-z])(cap|caps|capsule|capsules)(?![a-z])/i],
  ['TAB', /(?:^|[^a-z])(tab|tabs|tablet|tablets)(?![a-z])/i]
];

// Reads the unit printed on the bill ("100ML" -> ML, "1x10 CAP" -> CAP).
// Falls back to TAB only when the packing has no unit word at all.
const getPackingUnit = (packing) => {
  const text = String(packing || '').trim();
  const known = PACKING_UNITS.find(([, pattern]) => pattern.test(text));
  if (known) return known[0];
  const other = text.replace(/\d+(?:\.\d+)?\s*[x×*]\s*(?=\d)/gi, ' ').match(/[a-z]{2,}/i);
  return other ? other[0].toUpperCase() : 'TAB';
};

const isMeasureUnit = (unit) => MEASURE_UNITS.includes(unit);

const packingNumbers = (packing) => String(packing || '').match(/\d+(?:\.\d+)?/g)?.map(Number).filter((value) => Number.isFinite(value) && value > 0) || [];

const parsePacking = (packing, fallbackTabletsPerStrip = 1, fallbackStripsPerBox = 1) => {
  const numbers = packingNumbers(packing);
  const fallbackTabs = Math.max(1, Number(fallbackTabletsPerStrip) || 1);
  const fallbackStrips = Math.max(1, Number(fallbackStripsPerBox) || 1);
  if (numbers.length === 0) return { tabletsPerStrip: fallbackTabs, stripsPerBox: fallbackStrips };

  // "1x100 ML" is one bottle of 100 ml, not 100 bottles.
  if (isMeasureUnit(getPackingUnit(packing))) {
    return {
      tabletsPerStrip: Math.max(1, Math.round(numbers[numbers.length - 1])),
      stripsPerBox: numbers.length >= 2 ? Math.max(1, Math.round(numbers[0])) : 1
    };
  }

  // "10x10 TAB" means 10 strips per box, 10 tablets per strip.
  if (numbers.length >= 2) {
    const first = Math.max(1, Math.round(numbers[0]));
    const second = Math.max(1, Math.round(numbers[1]));
    return {
      tabletsPerStrip: second,
      stripsPerBox: first === 1 ? second : first
    };
  }

  // "10 TAB" is normally one strip containing 10 tablets.
  return { tabletsPerStrip: Math.max(1, Math.round(numbers[0])), stripsPerBox: 1 };
};

const normalizePacking = (packing, fallbackTabletsPerStrip = 1, fallbackStripsPerBox = 1) => {
  const unit = getPackingUnit(packing);
  const numbers = packingNumbers(packing);
  const parsed = parsePacking(packing, fallbackTabletsPerStrip, fallbackStripsPerBox);
  // Keep the printed volume as-is for measure units (e.g. 2.5 ML, 0.5 GM).
  const size = isMeasureUnit(unit) && numbers.length ? numbers[numbers.length - 1] : parsed.tabletsPerStrip;
  if (parsed.stripsPerBox > 1) return `${parsed.stripsPerBox}x${size} ${unit}`;
  return `${size} ${unit}`;
};

const parsePackSize = (packing, fallback = 1) => parsePacking(packing, fallback).tabletsPerStrip;

const getTotalUnits = (medicine) => {
  const packSize = Math.max(1, Number(medicine.packSize) || 1);
  return Math.max(0, Math.round((Number(medicine.quantity) || 0) * packSize) + (Number(medicine.looseQty) || 0));
};

const setStockFromUnits = (medicine, totalUnits, packSize = medicine.packSize) => {
  const safePackSize = Math.max(1, Number(packSize) || 1);
  const safeUnits = Math.max(0, Math.round(Number(totalUnits) || 0));
  medicine.packSize = safePackSize;
  medicine.quantity = Math.floor(safeUnits / safePackSize);
  medicine.looseQty = safeUnits % safePackSize;
};

const addStock = (medicine, quantity, freeQuantity = 0, packSize = medicine.packSize, stripsPerBox = medicine.stripsPerBox) => {
  const oldUnits = getTotalUnits(medicine);
  const receivedStrips = ((Number(quantity) || 0) + (Number(freeQuantity) || 0)) * (Number(stripsPerBox) || 1);
  const receivedUnits = Math.round(receivedStrips * (Number(packSize) || 1));
  setStockFromUnits(medicine, oldUnits + receivedUnits, packSize);
  medicine.stripsPerBox = Math.max(1, Number(stripsPerBox) || 1);
};

const getRequestedUnits = (item, packSize) => {
  const quantity = Number(item.quantity) || 0;
  return Math.round((item.unit === 'loose' ? quantity : quantity * (Number(packSize) || 1)));
};

module.exports = {
  parsePackSize,
  parsePacking,
  normalizePacking,
  getPackingUnit,
  getTotalUnits,
  setStockFromUnits,
  addStock,
  getRequestedUnits,
  roundStock
};
