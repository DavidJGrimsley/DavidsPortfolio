import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';

type StatusBadgeProps = {
  status: 'active' | 'inactive' | 'live' | 'offline';
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const isActive = status === 'active' || status === 'live';
  const displayLabel = label || (isActive ? '● LIVE' : '● OFFLINE');
  
  return (
    <View className={`px-3 py-1.5 rounded-xl ${isActive ? 'bg-success' : 'bg-error'}`}>
      <ThemedText inverse className="text-sm font-bold">
        {displayLabel}
      </ThemedText>
    </View>
  );
}
