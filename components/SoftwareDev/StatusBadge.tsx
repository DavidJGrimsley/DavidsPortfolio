import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { RFPercentage } from 'react-native-responsive-fontsize';

type StatusBadgeProps = {
  status: 'active' | 'inactive' | 'live' | 'offline';
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const isActive = status === 'active' || status === 'live';
  const displayLabel = label || (isActive ? '● LIVE' : '● OFFLINE');
  
  return (
    <View style={{
      backgroundColor: isActive ? '#10b981' : '#ef4444',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    }}>
      <ThemedText style={{ 
        fontSize: RFPercentage(1.4), 
        color: '#fff',
        fontWeight: 'bold'
      }}>
        {displayLabel}
      </ThemedText>
    </View>
  );
}
