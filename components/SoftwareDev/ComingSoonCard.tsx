import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';

type ComingSoonCardProps = {
  title: string;
  description: string;
};

export function ComingSoonCard({ title, description }: ComingSoonCardProps) {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={{
      backgroundColor: accentColor,
      borderRadius: 12,
      padding: 20,
      borderWidth: 2,
      borderColor: tintColor + '40',
      borderStyle: 'dashed',
    }}>
      <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 8 }}>
        {title}
      </ThemedText>
      <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.5), opacity: 0.7 }}>
        {description}
      </ThemedText>
    </View>
  );
}
