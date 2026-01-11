import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const typeClassName = 
    type === 'title' ? 'text-8 font-bold leading-8' :
    type === 'defaultSemiBold' ? 'text-base leading-6 font-semibold' :
    type === 'subtitle' ? 'text-xl font-bold' :
    type === 'link' ? 'text-base leading-7.5 text-tint' :
    'text-base leading-6';

  return (
    <Text
      style={[{ color }, style]}
      className={`text-themed ${typeClassName} ${className || ''}`}
      {...rest}
    />
  );
}
