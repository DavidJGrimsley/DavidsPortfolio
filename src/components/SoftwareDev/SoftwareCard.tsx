import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';
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
  stats: Array<{ emoji: string; label: string }>;
  onPress: () => void;
};

export function SoftwareCard({ item, stats, onPress }: SoftwareCardProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: accentColor,
        borderRadius: 12,
        padding: 20,
        opacity: pressed ? 0.8 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      })}
    >
      {/* Header with Icon and Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <ThemedText style={{ fontSize: RFPercentage(4) }}>
            {item.icon}
          </ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
              {item.name}
            </ThemedText>
            <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
              v{item.version}
            </ThemedText>
          </View>
        </View>
        
        <StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} />
      </View>

      {/* Description */}
      <ThemedText style={{ 
        fontSize: RFPercentage(1.8), 
        marginBottom: 16,
        lineHeight: RFPercentage(2.5),
        opacity: 0.8
      }}>
        {item.description}
      </ThemedText>

      <StatsRow stats={stats} />

      <TagList tags={item.tags} />

      {/* Call to Action */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: backgroundColor + '40',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <ThemedText style={{ 
          fontSize: RFPercentage(1.6),
          color: tintColor,
          fontWeight: 'bold'
        }}>
          View Documentation →
        </ThemedText>
        <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
          Interactive testing available
        </ThemedText>
      </View>
    </Pressable>
  );
}
