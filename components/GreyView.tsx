import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GreyViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const GreyView: React.FC<GreyViewProps> = ({ children, style }) => {
  return (
    <View style={[{ borderRadius: 8, overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={['rgba(90, 90, 100, 0.35)', 'rgba(60, 60, 70, 0.45)', 'rgba(90, 90, 100, 0.35)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 12,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};
