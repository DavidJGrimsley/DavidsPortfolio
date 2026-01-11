import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';

type TagListProps = {
  tags: string[];
};

export function TagList({ tags }: TagListProps) {
  const tintColor = useThemeColor({}, 'tint');
  
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tags.map((tag, index) => (
        <View 
          key={index}
          style={{
            backgroundColor: tintColor + '20',
            borderColor: tintColor + '40',
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <ThemedText style={{ 
            fontSize: RFPercentage(1.3),
            color: tintColor,
            fontWeight: '600'
          }}>
            {tag}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
