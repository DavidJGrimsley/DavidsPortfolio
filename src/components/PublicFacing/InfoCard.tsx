import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@/components/UI/HydratedIonicon';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type InfoCardProps = {
  icon: string;
  title: string;
  paragraphs: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

export function InfoCard({
  icon,
  title,
  paragraphs,
  collapsible = false,
  defaultExpanded = true,
}: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const tintColor = useThemeColor({}, 'tint');
  const contentVisible = !collapsible || isExpanded;
  const HeaderComponent = collapsible ? Pressable : View;

  return (
    <View className="bg-accent rounded-xl p-5 border-2 border-tint/40">
      <HeaderComponent
        {...(collapsible
          ? {
              accessibilityRole: 'button' as const,
              accessibilityState: { expanded: isExpanded },
              onPress: () => setIsExpanded((current) => !current),
            }
          : {})}
        className={`flex-row items-center ${contentVisible ? 'mb-3' : ''}`}
      >
        <ThemedText className="text-3xl mr-2.5">{icon}</ThemedText>
        <ThemedText type="subtitle" className="text-xl flex-1">
          {title}
        </ThemedText>
        {collapsible ? (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={tintColor}
          />
        ) : null}
      </HeaderComponent>
      {contentVisible
        ? paragraphs.map((paragraph, index) => (
            <ThemedText
              key={index}
              className={`text-base opacity-80 leading-6 ${index < paragraphs.length - 1 ? 'mb-3' : ''}`}
            >
              {paragraph}
            </ThemedText>
          ))
        : null}
    </View>
  );
}
