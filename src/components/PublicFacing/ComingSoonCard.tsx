import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { responsiveFontSize } from '@/utils/responsive-font-size';

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
      <ThemedText type="subtitle" style={{ fontSize: responsiveFontSize(2.5), marginBottom: 8 }}>
        {title}
      </ThemedText>
      <ThemedText style={{ fontSize: responsiveFontSize(1.8), lineHeight: responsiveFontSize(2.5), opacity: 0.7 }}>
        {description}
      </ThemedText>
    </View>
  );
}
