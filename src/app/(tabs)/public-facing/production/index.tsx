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
      leadBody="These apps, games, and other creations are from my own mind and built by me, with possible collaboration from others. Your support is greatly appreciated, so please check them out and share them with folks who might benefit from their use."
      leadSubBody="My Linux VPS is where I host web apps and the backend APIs that mobile applications and games need."
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
