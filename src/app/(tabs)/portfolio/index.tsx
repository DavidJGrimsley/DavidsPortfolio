import React from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { TabContainer } from '@/components/Navigation/TabContainer';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';

export default function PortfolioIndexPage() {
  const router = useRouter();

  return (
    <TabContainer
      titleA="My"
      titleB="Portfolio"
      leadBody="Browse projects across mobile apps, website development, game design, and software development. Each piece includes highlights, screenshots, and the tech and skills involved."
      leadSubBody="If you're looking to hire someone to build a website or app, these are real examples of how I approach UX, architecture, and production details."
      seo={{
        title: 'Portfolio',
        description:
          'Portfolio projects by David Grimsley: mobile apps, websites, game design, and software development. Explore real examples of UX, architecture, and APIs.',
        path: '/portfolio',
        keywords: [
          'portfolio',
          'website building',
          'web development',
          'mobile apps',
          'React Native',
          'software development',
          'API development',
        ],
        type: 'website',
      }}
    >
      <View className="w-full flex flex-col gap-4">
        <SoftwareCard
          item={{
            id: 'mobile-apps',
            name: 'Mobile Applications',
            version: 'portfolio',
            icon: '📱',
            description: 'Cross-platform apps built with React Native and Expo.',
            status: 'active',
            tags: ['React Native', 'Expo', 'iOS/Android'],
          }}
          stats={[{ emoji: '🧭', label: 'Navigation + UX' }, { emoji: '📦', label: 'Real project builds' }]}
          ctaLabel="Explore Mobile Apps →"
          ctaHint="Case studies"
          onPress={() => router.push('/portfolio/mobile-apps' as any)}
        />

        <SoftwareCard
          item={{
            id: 'website-development',
            name: 'Website Development',
            version: 'portfolio',
            icon: '🌐',
            description: 'Responsive, SEO-minded websites and web experiences.',
            status: 'active',
            tags: ['SEO', 'Performance', 'Responsive'],
          }}
          stats={[{ emoji: '⚡', label: 'Performance' }, { emoji: '🔎', label: 'Search-ready' }]}
          ctaLabel="Explore Websites →"
          ctaHint="Responsive builds"
          onPress={() => router.push('/portfolio/website-development' as any)}
        />

        <SoftwareCard
          item={{
            id: 'game-design',
            name: 'Game Design',
            version: 'portfolio',
            icon: '🎮',
            description: 'Games and interactive experiences across platforms.',
            status: 'active',
            tags: ['Design', 'Gameplay', 'Tools'],
          }}
          stats={[{ emoji: '🧠', label: 'Systems thinking' }, { emoji: '🕹️', label: 'Player experience' }]}
          ctaLabel="Explore Games →"
          ctaHint="Design + builds"
          onPress={() => router.push('/portfolio/game-design' as any)}
        />

        <SoftwareCard
          item={{
            id: 'software-development',
            name: 'Software Development',
            version: 'portfolio',
            icon: '🧰',
            description: 'Backend, tooling, architecture, and software projects.',
            status: 'active',
            tags: ['APIs', 'Architecture', 'Tooling'],
          }}
          stats={[{ emoji: '🏗️', label: 'Architecture' }, { emoji: '🔌', label: 'APIs + tools' }]}
          ctaLabel="Explore Software Dev →"
          ctaHint="Projects"
          onPress={() => router.push('/portfolio/software-development' as any)}
        />
      </View>
    </TabContainer>
  );
}
