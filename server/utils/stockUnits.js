const roundStock = (value) => Math.round((Number(value) || 0) * 1000000) / 1000000;

const parsePacking = (packing, fallbackTabletsPerStrip = 1, fallbackStripsPerBox = 1) => {
  const text = String(packing || '').trim().toLowerCase();
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((value) => Number.isFinite(value) && value > 0) || [];
  const fallbackTabs = Math.max(1, Number(fallbackTabletsPerStrip) || 1);
  const fallbackStrips = Math.max(1, Number(fallbackStripsPerBox) || 1);
  if (numbers.length === 0) return { tabletsPerStrip: fallbackTabs, stripsPerBox: fallbackStrips };

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
  getTotalUnits,
  setStockFromUnits,
  addStock,
  getRequestedUnits,
  roundStock
};
