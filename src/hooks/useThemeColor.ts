/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

const lightColors = {
  text: '#11181C',
  background: '#fff',
  tint: '#0a7ea4',
  icon: '#687076',
  tabIconDefault: '#687076',
  tabIconSelected: '#0a7ea4',
  accent: '#007AFF',
  secondary: '#FF6B35',
};

const darkColors = {
  text: '#ECEDEE',
  background: '#151718',
  tint: '#fff',
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#fff',
  accent: '#0A84FF',
  secondary: '#FF9500',
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
