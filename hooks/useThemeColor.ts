/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props ? (props as any)[theme] : undefined;

  if (colorFromProps) {
    return colorFromProps;
  }

  // Defensive: ensure Colors exists and has the requested theme/key
  if (Colors && Colors[theme] && Colors[theme][colorName]) {
    return Colors[theme][colorName as keyof typeof Colors.light];
  }

  // Fallback color to avoid runtime crash
  return theme === 'dark' ? '#FFFFFF' : '#000000';
}
