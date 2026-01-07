import React, { useMemo } from 'react';
import { View, ScrollView, Linking } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SoftwareCard } from '@/components/SoftwareDev/SoftwareCard';
import productionData from '@json/production.json';

type ProductionApp = {
  id: string;
  name: string;
  version: string;
  icon: string;
  description: string;
  status: string;
  tags: string[];
  url: string;
  repoUrl?: string;
};

export default function ProductionIndexPage() {
  const backgroundColor = useThemeColor({}, 'background');

  const apps = useMemo(() => (productionData as any)?.apps ?? [], []) as ProductionApp[];

  const getHostLabel = (url: string) => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  };

  const handleOpen = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <View className="px-5 pt-10 pb-5">
        <ThemedText type="title" className="mb-2 text-[4%] leading-[4.8%]">
          Production
        </ThemedText>
        <ThemedText className="opacity-70 text-[2%] leading-[2.8%]">
          Published apps and projects you can try right now
        </ThemedText>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10 gap-4">
        {apps.map((app) => (
          <SoftwareCard
            key={app.id}
            item={app}
            stats={[
              { emoji: '🌐', label: getHostLabel(app.url) },
              { emoji: '🔗', label: app.repoUrl ? 'GitHub available' : 'Public release' },
            ]}
            ctaLabel="Visit site →"
            ctaHint="Opens in browser"
            onPress={() => handleOpen(app.url)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
