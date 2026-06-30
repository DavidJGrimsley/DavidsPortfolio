import React, { useEffect, useState, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import NativeIonicons from '@expo/vector-icons/Ionicons';

type IoniconProps = ComponentProps<typeof NativeIonicons>;

const HydratedIoniconBase: React.FC<IoniconProps> = ({
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

  return <NativeIonicons size={size} style={style} className={className} {...props} />;
};

const HydratedIonicon = Object.assign(HydratedIoniconBase, {
  font: NativeIonicons.font,
  glyphMap: NativeIonicons.glyphMap,
});

export default HydratedIonicon;
