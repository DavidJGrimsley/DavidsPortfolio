/**
 * Color constants for the app.
 * 
 * MIGRATION NOTE: These colors are now available as CSS variables in global.css:
 * - Use className utilities like: text-themed, bg-themed, text-secondary, etc.
 * - For custom values, use: text-[var(--color-text)], bg-[var(--color-background)], etc.
 * 
 * Example migrations:
 *   style={{ color: Colors[colorScheme].text }} → className="text-themed"
 *   style={{ backgroundColor: Colors[colorScheme].accent }} → className="bg-accent"
 */

const tintColorLight = '#4B718A'; // blue-gray
const tintColorDark = '#a96710'; // secondary
const accentColorLight = '#723B80'; // dark purple

const white = '#F4F4F4';
const black = '#040404';

const Colors = {
  white: white,
  black: black,
  transparent: 'transparent',
  light: {
    text: '#11181C', // black
    background: '#ae54c4', // purple
    secondary: '#afeef7', // light blue
    accent: accentColorLight, // dark purple
    tint: tintColorLight,
    icon: '#687076', // gray
    tabIconDefault: accentColorLight, // accent
    tabIconSelected: tintColorLight,
    whiteOrBlack: white
  },
  dark: {
    text: '#FEFEFE', // white
    background: '#20182d', // plum
    secondary: '#a96710', // orange
    tint: tintColorDark,
    icon: '#9BA1A6', // gray
    tabIconDefault: '#321e3bb9', // accent
    tabIconSelected: tintColorDark,
    accent: '#321e3bb9', // dark purple
    whiteOrBlack: black
  },
};

export { Colors };
export default Colors;

