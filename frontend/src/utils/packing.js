// Packing helpers — keep in sync with server/utils/stockUnits.js.

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
export const getPackingUnit = (packing) => {
  const text = String(packing || '').trim();
  const known = PACKING_UNITS.find(([, pattern]) => pattern.test(text));
  if (known) return known[0];
  const other = text.replace(/\d+(?:\.\d+)?\s*[x×*]\s*(?=\d)/gi, ' ').match(/[a-z]{2,}/i);
  return other ? other[0].toUpperCase() : 'TAB';
};

const packingNumbers = (packing) => String(packing || '').match(/\d+(?:\.\d+)?/g)?.map(Number).filter(n => Number.isFinite(n) && n > 0) || [];

// { size, strips } — "10x10 TAB" = 10 strips of 10; "1x100 ML" = 1 bottle of 100 ml.
export const parsePacking = (packing, fallbackSize = 1, fallbackStrips = 1) => {
  const numbers = packingNumbers(packing);
  if (numbers.length === 0) return { size: Math.max(1, Number(fallbackSize) || 1), strips: Math.max(1, Number(fallbackStrips) || 1) };
  if (MEASURE_UNITS.includes(getPackingUnit(packing))) {
    return { size: numbers[numbers.length - 1], strips: numbers.length >= 2 ? Math.max(1, Math.round(numbers[0])) : 1 };
  }
  if (numbers.length >= 2) {
    const first = Math.max(1, Math.round(numbers[0]));
    const second = Math.max(1, Math.round(numbers[1]));
    return { size: second, strips: first === 1 ? second : first };
  }
  return { size: Math.max(1, Math.round(numbers[0])), strips: 1 };
};

// "100ml" -> "100 ML", "10*10 tab" -> "10x10 TAB", "15 gm" -> "15 GM".
// Empty packing falls back to packSize/stripsPerBox as tablets.
export const normalizePacking = (packing, fallbackSize = 1, fallbackStrips = 1) => {
  const unit = getPackingUnit(packing);
  const { size, strips } = parsePacking(packing, fallbackSize, fallbackStrips);
  return strips > 1 ? `${strips}x${size} ${unit}` : `${size} ${unit}`;
};
