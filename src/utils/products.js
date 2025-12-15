const localImageMap = {
  '../assets/data/seed1.png': require('../../assets/data/seed1.png'),
  '../assets/data/seed2.png': require('../../assets/data/seed2.png'),
  '../assets/data/seed3.png': require('../../assets/data/seed3.png'),
  '../assets/data/seed4.png': require('../../assets/data/seed4.png'),
  '../assets/data/cropnutri1.png': require('../../assets/data/cropnutri1.png'),
  '../assets/data/cropnutri2.png': require('../../assets/data/cropnutri2.png'),
  '../assets/data/cropnutri3.png': require('../../assets/data/cropnutri3.png'),
  '../assets/data/cropnutri4.png': require('../../assets/data/cropnutri4.png'),
  '../assets/data/cropprotection1.png': require('../../assets/data/cropprotection1.png'),
  '../assets/data/cropprotection2.png': require('../../assets/data/cropprotection2.png'),
  '../assets/data/cropprotection3.png': require('../../assets/data/cropprotection3.png'),
  '../assets/data/cropprotection4.png': require('../../assets/data/cropprotection4.png'),
  '../assets/data/gardencare1.png': require('../../assets/data/gardencare1.png'),
  '../assets/data/gardencare2.png': require('../../assets/data/gardencare2.png'),
  '../assets/data/gardencare3.png': require('../../assets/data/gardencare3.png'),
  '../assets/data/gardencare4.png': require('../../assets/data/gardencare4.png'),
  '../assets/data/agriequip1.png': require('../../assets/data/agriequip1.png'),
};

export const UNIT_TYPES = {
  SOLID: 'solid',
  LIQUID: 'liquid',
  UNIT: 'unit',
};

const inferBaselineUnit = (unitType = UNIT_TYPES.SOLID) => {
  switch (unitType) {
    case UNIT_TYPES.LIQUID:
      return 'ml';
    case UNIT_TYPES.UNIT:
      return 'unit';
    default:
      return 'gm';
  }
};

const stripTrailingZeros = (value) => {
  if (!Number.isFinite(value)) return value;
  const fixed = value.toFixed(2);
  return parseFloat(fixed) % 1 === 0 ? parseInt(fixed, 10).toString() : parseFloat(fixed).toString();
};

const formatQuantityWithUnit = (quantity, unit) => {
  if (!Number.isFinite(quantity)) return '';
  switch (unit) {
    case 'gm':
      if (quantity >= 1000) return `${stripTrailingZeros(quantity / 1000)} kg`;
      return `${stripTrailingZeros(quantity)} gm`;
    case 'kg':
      return `${stripTrailingZeros(quantity)} kg`;
    case 'ml':
      if (quantity >= 1000) return `${stripTrailingZeros(quantity / 1000)} L`;
      return `${stripTrailingZeros(quantity)} ml`;
    case 'l':
    case 'L':
      return `${stripTrailingZeros(quantity)} L`;
    case 'unit':
      return `${stripTrailingZeros(quantity)} unit${quantity === 1 ? '' : 's'}`;
    default:
      return `${stripTrailingZeros(quantity)} ${unit}`;
  }
};

const createPackOption = (quantity, unit, unitType, extra = {}) => {
  const label = formatQuantityWithUnit(quantity, unit);
  return {
    ...extra,
    label,
    size: label,
    quantity,
    unit: inferUnitFromLabel(label, unitType),
  };
};

const parseQuantityFromString = (raw) => {
  if (raw == null) {
    return { quantity: null, unit: null };
  }
  const str = raw.toString().trim().toLowerCase();
  const match = str.match(/([\d.,]+)/);
  const quantity = match ? parseFloat(match[1].replace(/,/g, '')) : null;
  let unit = null;
  if (str.includes('kg')) unit = 'kg';
  else if (str.includes('gm') || str.includes(' g')) unit = 'gm';
  else if (str.includes('ml')) unit = 'ml';
  else if (str.includes(' litre') || str.includes(' liter') || str.endsWith(' l') || str.endsWith('l')) unit = 'l';
  else if (str.includes('unit') || str.includes('pc') || str.includes('piece') || str.includes('qty')) unit = 'unit';
  return { quantity, unit };
};

const formatSizeLabel = (raw, unitType) => {
  if (raw == null) return null;
  if (typeof raw === 'number') {
    const baselineUnit = inferBaselineUnit(unitType);
    return formatQuantityWithUnit(raw, baselineUnit);
  }
  const { quantity, unit } = parseQuantityFromString(raw);
  if (quantity == null) return raw.toString().trim();
  const baselineUnit = inferBaselineUnit(unitType);
  return formatQuantityWithUnit(quantity, unit || baselineUnit);
};

const inferUnitFromLabel = (label, unitType) => {
  if (!label) return inferBaselineUnit(unitType);
  const lower = label.toLowerCase();
  if (lower.includes('kg')) return 'kg';
  if (lower.includes('gm') || lower.includes(' g')) return 'gm';
  if (lower.includes('ml')) return 'ml';
  if (lower.includes('l')) return 'L';
  if (lower.includes('unit')) return 'unit';
  return inferBaselineUnit(unitType);
};

const normalizePackOption = (option, unitType) => {
  if (!option) return null;
  if (typeof option === 'string') {
    const formatted = formatSizeLabel(option, unitType);
    return {
      label: formatted,
      size: formatted,
      unit: inferUnitFromLabel(formatted, unitType),
    };
  }
  const formatted = formatSizeLabel(option.size || option.label, unitType);
  return {
    ...option,
    label: formatted,
    size: formatted,
    unit: inferUnitFromLabel(formatted, unitType),
  };
};

const DEFAULT_PACKS = {
  [UNIT_TYPES.SOLID]: [
    createPackOption(200, 'gm', UNIT_TYPES.SOLID),
    createPackOption(500, 'gm', UNIT_TYPES.SOLID),
    createPackOption(1000, 'gm', UNIT_TYPES.SOLID),
  ],
  [UNIT_TYPES.LIQUID]: [
    createPackOption(250, 'ml', UNIT_TYPES.LIQUID),
    createPackOption(500, 'ml', UNIT_TYPES.LIQUID),
    createPackOption(1000, 'ml', UNIT_TYPES.LIQUID),
  ],
  [UNIT_TYPES.UNIT]: [createPackOption(1, 'unit', UNIT_TYPES.UNIT)],
};

const inferUnitTypeFromCategory = (category = '') => {
  const normalized = category.toLowerCase();
  if (normalized.includes('equipment') || normalized.includes('garden')) {
    return UNIT_TYPES.UNIT;
  }
  if (normalized.includes('liquid')) {
    return UNIT_TYPES.LIQUID;
  }
  return UNIT_TYPES.SOLID;
};

export const resolvePackOptions = (product = {}) => {
  const unitType = product.unitType || inferUnitTypeFromCategory(product.category || '');
  const customPackOptions = Array.isArray(product.packOptions) && product.packOptions.length > 0
    ? product.packOptions
    : (Array.isArray(product.packs) && product.packs.length > 0 ? product.packs : null);

  if (customPackOptions) {
    const normalized = customPackOptions
      .map((option) => normalizePackOption(option, unitType))
      .filter(Boolean);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  const formattedSize = formatSizeLabel(product.size, unitType);
  if (formattedSize) {
    return [
      {
        label: formattedSize,
        size: formattedSize,
        unit: inferUnitFromLabel(formattedSize, unitType),
      },
    ];
  }

  return DEFAULT_PACKS[unitType] || DEFAULT_PACKS[UNIT_TYPES.SOLID];
};

const productIdToImageMap = {
  1001: '../assets/data/seed1.png',
  1002: '../assets/data/seed2.png',
  1003: '../assets/data/seed3.png',
  1004: '../assets/data/seed4.png',
  2001: '../assets/data/cropnutri1.png',
  2002: '../assets/data/cropnutri2.png',
  2003: '../assets/data/cropnutri3.png',
  2004: '../assets/data/cropnutri4.png',
  3001: '../assets/data/cropprotection1.png',
  3002: '../assets/data/cropprotection2.png',
  3003: '../assets/data/cropprotection3.png',
  3004: '../assets/data/cropprotection4.png',
  4001: '../assets/data/gardencare1.png',
  4002: '../assets/data/gardencare2.png',
  4003: '../assets/data/gardencare3.png',
  4004: '../assets/data/gardencare4.png',
  5001: '../assets/data/agriequip1.png',
};

export const getProductImageSource = (product) => {
  if (!product) return null;
  
  // Priority 1: imageRequire (direct require statement)
  if (product.imageRequire) return product.imageRequire;
  
  // Priority 2: Normalize image/imageUri to imageUri
  const imageUri = product.imageUri || product.image;
  
  if (imageUri) {
    // Check local image map
    if (localImageMap[imageUri]) {
      return localImageMap[imageUri];
    }
    // Check if it's a remote URL
    if (/^https?:/i.test(imageUri)) {
      return { uri: imageUri };
    }
    // Try to find in localImageMap with the imageUri as key
    if (typeof imageUri === 'string' && imageUri.includes('../assets')) {
      if (localImageMap[imageUri]) {
        return localImageMap[imageUri];
      }
    }
  }
  
  // Priority 3: Try to get image from product ID mapping
  if (product.id) {
    const productIdToImageMap = {
      1001: '../assets/data/seed1.png',
      1002: '../assets/data/seed2.png',
      1003: '../assets/data/seed3.png',
      1004: '../assets/data/seed4.png',
      2001: '../assets/data/cropnutri1.png',
      2002: '../assets/data/cropnutri2.png',
      2003: '../assets/data/cropnutri3.png',
      2004: '../assets/data/cropnutri4.png',
      3001: '../assets/data/cropprotection1.png',
      3002: '../assets/data/cropprotection2.png',
      3003: '../assets/data/cropprotection3.png',
      3004: '../assets/data/cropprotection4.png',
      4001: '../assets/data/gardencare1.png',
      4002: '../assets/data/gardencare2.png',
      4003: '../assets/data/gardencare3.png',
      4004: '../assets/data/gardencare4.png',
      5001: '../assets/data/agriequip1.png',
    };
    
    // Handle section-prefixed IDs (e.g., "recommended-1001", "best-1003")
    const baseId = typeof product.id === 'string' 
      ? parseInt(product.id.split('-').pop(), 10) 
      : product.id;
    
    if (productIdToImageMap[baseId]) {
      const imagePath = productIdToImageMap[baseId];
      if (localImageMap[imagePath]) {
        return localImageMap[imagePath];
      }
    }
  }
  
  return null;
};

export const getProductForNavigation = (product) => {
  if (!product) return product;
  if (product.imageUri) return product;
  if (product.imageRequire && product.id) {
    const baseId = typeof product.id === 'string'
      ? parseInt(product.id.split('-').pop(), 10)
      : product.id;
    const imagePath = productIdToImageMap[baseId];
    if (imagePath) {
      return { ...product, imageUri: imagePath };
    }
  }
  return product;
};

export const productImageMap = localImageMap;

export default {
  productImageMap,
  getProductImageSource,
  getProductForNavigation,
  resolvePackOptions,
  UNIT_TYPES,
};

