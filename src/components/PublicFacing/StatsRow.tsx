import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { responsiveFontSize } from '@/utils/responsive-font-size';

type StatsRowProps = {
  stats: { emoji: string; label: string }[];
};

export function StatsRow({ stats }: StatsRowProps) {
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12
    }}>
      {stats.map((stat, index) => (
        <View 
          key={index}
          style={{ 
            backgroundColor: backgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <ThemedText style={{ fontSize: responsiveFontSize(1.4), opacity: 0.7 }}>
            {stat.emoji} {stat.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
