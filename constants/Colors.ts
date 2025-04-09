/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4B718A'; // blue-gray
const tintColorDark = '#a96710'; // secondary
const accentColorLight = '#723B80'; // dark purple

export default {
  light: {
    text: '#11181C', // black
    background: '#ae54c4', // purple
    secondary: '#afeef7', // light blue
    accent: accentColorLight, // dark purple
    tint: tintColorLight, 
    icon: '#687076', // gray
    tabIconDefault: accentColorLight, // accent
    tabIconSelected: tintColorLight,
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
  },
};

