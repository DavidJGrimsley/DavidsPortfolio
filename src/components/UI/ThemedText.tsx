import React from 'react';
import { Platform, Text, type TextProps } from 'react-native';
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
import { useThemeColor } from '@/hooks/useThemeColor';

const headingMap = {
  1: H1,
  2: H2,
  3: H3,
  4: H4,
  5: H5,
  6: H6,
} as const;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  aria?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  /**
   * Web: renders a real <h1>.. <h6> (SEO + a11y). Native: marks as an accessibility header.
   * Keep this to one per screen for level=1.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Visual heading sizing independent of semantic headingLevel.
   */
  visualHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Uses the theme's inverse text token (white/black swap).
   */
  inverse?: boolean;
};

export function ThemedText({
  children,
  style,
  lightColor,
  darkColor,
  type = 'default',
  aria,
  headingLevel,
  visualHeadingLevel,
  inverse,
  className,
  ...rest
}: ThemedTextProps) {
  const hasCustomColor = lightColor != null || darkColor != null;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const typeClassName =
    type === 'title' ? 'typo-title' :
    type === 'defaultSemiBold' ? 'typo-body-semibold' :
    type === 'subtitle' ? 'typo-subtitle' :
    type === 'link' ? 'typo-link' :
    'typo-body';

  const visualHeadingClassName =
    visualHeadingLevel === 1 ? 'typo-h1' :
    visualHeadingLevel === 2 ? 'typo-h2' :
    visualHeadingLevel === 3 ? 'typo-h3' :
    visualHeadingLevel === 4 ? 'typo-h4' :
    visualHeadingLevel === 5 ? 'typo-h5' :
    visualHeadingLevel === 6 ? 'typo-h6' :
    '';

  const toneClassName = inverse ? 'text-white-or-black' : 'text-themed';

  const combinedClassName = `${toneClassName} ${typeClassName} ${visualHeadingClassName} ${className || ''}`.trim();

  const baseStyle = hasCustomColor ? [{ color }, style] : style;

  const webStyle = Array.isArray(baseStyle)
    ? Object.assign({}, ...baseStyle.filter(Boolean))
    : baseStyle;

  if (Platform.OS === 'web' && headingLevel != null) {
    const Heading = headingMap[headingLevel];
    return (
      <Heading
        className={combinedClassName}
        style={webStyle as any}
        aria-label={aria}
        {...(rest as any)}
      >
        {children}
      </Heading>
    );
  }

  return (
    <Text
      style={baseStyle}
      className={combinedClassName}
      accessibilityLabel={aria}
      accessibilityRole={headingLevel != null ? 'header' : rest.accessibilityRole}
      {...rest}
    >
      {children}
    </Text>
  );
}
