/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

// Theme tokens matching global.css + temp/Colors.ts
const lightColors = {
  text: '#11181C',
  background: '#ae54c4',
  secondary: '#afeef7',
  accent: '#723B80',
  tint: '#4B718A',
  icon: '#687076',
  tabIconDefault: '#723B80',
  tabIconSelected: '#4B718A',
  whiteOrBlack: '#F4F4F4',
};

const darkColors = {
  text: '#FEFEFE',
  background: '#20182d',
  secondary: '#a96710',
  accent: '#321e3bb9',
  tint: '#a96710',
  icon: '#9BA1A6',
  tabIconDefault: '#321e3bb9',
  tabIconSelected: '#a96710',
  whiteOrBlack: '#040404',
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightColors
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props ? (props as any)[theme] : undefined;

  if (colorFromProps) {
    return colorFromProps;
  }

  return theme === 'dark' ? darkColors[colorName] : lightColors[colorName];
}
