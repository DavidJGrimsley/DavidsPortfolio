import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GreyViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

export const GreyView: React.FC<GreyViewProps> = ({ children, style, className }) => {
  return (
    <View className={`rounded-lg overflow-hidden ${className || ''}`} style={style}>
      <LinearGradient
        colors={['rgba(90, 90, 100, 0.35)', 'rgba(60, 60, 70, 0.45)', 'rgba(90, 90, 100, 0.35)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-3 rounded-lg shadow-md"
      >
        {children}
      </LinearGradient>
    </View>
  );
};
