import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { StatusBadge } from './StatusBadge';
import { StatsRow } from './StatsRow';
import { TagList } from './TagList';

type SoftwareCardProps = {
  item: {
    id: string;
    name: string;
    version: string;
    icon: string;
    description: string;
    status: string;
    tags: string[];
  };
  stats: { emoji: string; label: string }[];
  ctaLabel?: string;
  ctaHint?: string;
  onPress: () => void;
};

export function SoftwareCard({ item, stats, ctaLabel, ctaHint, onPress }: SoftwareCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-accent rounded-xl p-5 shadow-md active:opacity-80"
    >
      {/* Header with Icon and Status */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <ThemedText className="text-4xl">
            {item.icon}
          </ThemedText>
          <View className="flex-1">
            <ThemedText type="subtitle" className="text-xl">
              {item.name}
            </ThemedText>
            <ThemedText className="text-sm opacity-60">
              v{item.version}
            </ThemedText>
          </View>
        </View>
        
        <StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} />
      </View>

      {/* Description */}
      <ThemedText className="text-base mb-4 leading-6 opacity-80">
        {item.description}
      </ThemedText>

      <StatsRow stats={stats} />

      <TagList tags={item.tags} />

      {/* Call to Action */}
      <View className="mt-4 pt-4 border-t border-white-or-black/25 flex-col items-start gap-1 md:flex-row md:items-center md:justify-between">
        <ThemedText className="text-base text-tint font-bold">
          {ctaLabel ?? 'View Documentation →'}
        </ThemedText>
        <ThemedText className="text-sm opacity-60">
          {ctaHint ?? 'Interactive testing available'}
        </ThemedText>
      </View>
    </Pressable>
  );
}
