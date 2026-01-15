import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';
import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
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
    <PublicFacingIndexWrapper
      title="Production Applications"
      subtitle="Published apps and projects you can try right now"
    >
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
    </PublicFacingIndexWrapper>
  );
}
