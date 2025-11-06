import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Reference sizes based on iPhone X
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Viewport helpers
export const vw = (percentage) => (SCREEN_WIDTH * percentage) / 100;
export const vh = (percentage) => (SCREEN_HEIGHT * percentage) / 100;

// Linear scale helpers
export const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const verticalScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
export const hs = scale;
export const vs = verticalScale;

// Moderate scale
export const moderateScale = (size, factor = 0.5) => {
  const scaled = scale(size);
  return size + (scaled - size) * factor;
};
export const ms = moderateScale;

// Misc helpers
export const toDp = (size) => PixelRatio.roundToNearestPixel(size);
export const responsiveFontSize = (size, factor = 0.5) => Math.round(PixelRatio.roundToNearestPixel(moderateScale(size, factor)));
export const responsiveSpacing = (size, factor = 0.5) => Math.round(moderateScale(size, factor));

