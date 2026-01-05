import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';

type InfoCardProps = {
  icon: string;
  title: string;
  paragraphs: string[];
};

export function InfoCard({ icon, title, paragraphs }: InfoCardProps) {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={{
      backgroundColor: accentColor,
      borderRadius: 12,
      padding: 20,
      borderWidth: 2,
      borderColor: tintColor + '60',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <ThemedText style={{ fontSize: RFPercentage(3), marginRight: 10 }}>
          {icon}
        </ThemedText>
        <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
          {title}
        </ThemedText>
      </View>
      {paragraphs.map((paragraph, index) => (
        <ThemedText 
          key={index}
          style={{ 
            fontSize: RFPercentage(1.8), 
            opacity: 0.8, 
            lineHeight: RFPercentage(2.5),
            marginBottom: index < paragraphs.length - 1 ? 12 : 0
          }}
        >
          {paragraph}
        </ThemedText>
      ))}
    </View>
  );
}
