import React, { useEffect, useState, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import NativeFontAwesome6 from '@expo/vector-icons/FontAwesome6';

type FontAwesome6Props = ComponentProps<typeof NativeFontAwesome6>;

const HydratedFontAwesome6Base: React.FC<FontAwesome6Props> = ({
  size = 24,
  style,
  className,
  ...props
}) => {
  const [hasMounted, setHasMounted] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (Platform.OS === 'web' && !hasMounted) {
    return (
      <View
        accessibilityElementsHidden
        className={className}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          {
            width: size,
            height: size,
          },
          style as any,
        ]}
      />
    );
  }

  return (
    <NativeFontAwesome6
      size={size}
      style={style}
      className={className}
      {...props}
    />
  );
};

const HydratedFontAwesome6 = Object.assign(HydratedFontAwesome6Base, {
  font: NativeFontAwesome6.font,
  glyphMap: NativeFontAwesome6.glyphMap,
});

export default HydratedFontAwesome6;
