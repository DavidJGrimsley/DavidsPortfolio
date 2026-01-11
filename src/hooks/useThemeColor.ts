/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

// Theme tokens matching global.css + temp/Colors.ts
const lightColors = {
  text: '#11181C',
  background: '#E9DDEE',
  secondary: '#A2DDF6',
  accent: '#723B80',
  tint: '#0E668B',
  icon: '#687076',
  tabIconDefault: '#723B80',
  tabIconSelected: '#0E668B',
  whiteOrBlack: '#F8F8F8',
};

const darkColors = {
  text: '#F8F8F8',
  background: '#20182D',
  secondary: '#A96710',
  accent: '#321E3B',
  tint: '#EEA444',
  icon: '#9BA1A6',
  tabIconDefault: '#321E3B',
  tabIconSelected: '#A96710',
  whiteOrBlack: '#11181C',
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
