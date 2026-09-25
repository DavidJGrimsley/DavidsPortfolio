import React from 'react';
import type { GenerateMetadataFunction } from 'expo-router/server';
import { landingMetadata, landingSeoProps } from '@/constants/landing-seo';

import { useRouter } from 'expo-router';

import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';

export const generateMetadata: GenerateMetadataFunction = () => landingMetadata('/public-facing');
export default function PublicFacingHomePage() {
  const router = useRouter();

  return (
    <PublicFacingIndexWrapper
      title="Public Tools"
      leadBody="Try my public APIs, explore MCP tools, and visit apps I've shipped."
      leadSubBody="Each section explains what the tools do and where to start."
      seo={{
        keywords: [
          'public APIs',
          'what is an API',
          'MCP',
          'Model Context Protocol',
          'what is MCP',
          'developer tools',
          'APIs and MCPs',
        ],
        type: 'website',
        ...landingSeoProps('/public-facing'),
      }}
    >
      <SoftwareCard
        item={{
          id: 'api',
          name: 'Public APIs',
          version: 'live',
          icon: '📡',
          description: 'Hosted endpoints with docs, examples, and uptime notes.',
          status: 'active',
          tags: ['REST', 'JSON', 'Docs'],
        }}
        stats={[{ emoji: '🧠', label: 'Learn what an API is' }, { emoji: '⚡', label: 'Live endpoints' }]}
        ctaLabel="Browse APIs →"
        ctaHint="Docs + examples"
        onPress={() => router.push('/public-facing/api' as any)}
      />

      <SoftwareCard
        item={{
          id: 'mcp',
          name: 'MCP Servers',
          version: 'live',
          icon: '🧩',
          description: 'Model Context Protocol servers exposing tools, prompts, and resources.',
          status: 'active',
          tags: ['MCP', 'AI tools', 'Open source'],
        }}
        stats={[{ emoji: '🧠', label: 'Learn what MCP is' }, { emoji: '🛠️', label: 'Tools + resources' }]}
        ctaLabel="Browse MCP Servers →"
        ctaHint="Tools + prompts"
        onPress={() => router.push('/public-facing/mcp' as any)}
      />

      <SoftwareCard
        item={{
          id: 'production',
          name: 'Production Apps',
          version: 'live',
          icon: '🚀',
          description: 'Deployed apps, games, and projects you can use today.',
          status: 'active',
          tags: ['Live', 'Portfolio', 'Projects'],
        }}
        stats={[{ emoji: '🌐', label: 'Live links' }, { emoji: '🔗', label: 'Repos when available' }]}
        ctaLabel="View Production Apps →"
        ctaHint="Visit sites"
        onPress={() => router.push('/public-facing/production' as any)}
      />
    </PublicFacingIndexWrapper>
  );
}
