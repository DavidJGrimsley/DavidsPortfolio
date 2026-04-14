import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';
import { ComingSoonCard } from '~/src/components/PublicFacing/ComingSoonCard';
import { WhatIsAPICard } from '~/src/components/PublicFacing/api/WhatIsAPICard';
import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
import { useFetchPortfolio } from '@/hooks/useFetchPortfolio';
import { QUANTUM_PORTFOLIO_URL } from '@/lib/quantum-api-config';
import apisData from '@json/apis.json';

type QuantumPortfolio = {
  api: {
    id: string;
    name: string;
    version: string;
    icon: string;
    description: string;
    baseUrl: string;
    docsUrl?: string;
    healthUrl?: string;
    status: string;
    featured?: boolean;
    tags: string[];
    uptime: string;
  };
  endpoints: {
    method: string;
    path: string;
    summary: string;
    description?: string;
  }[];
};

type ApiCardItem = {
  id: string;
  name: string;
  version: string;
  icon: string;
  description: string;
  baseUrl: string;
  docsUrl?: string;
  healthUrl?: string;
  status: string;
  featured?: boolean;
  tags: string[];
  uptime?: string;
  endpoints?: number;
};

export default function APIIndexPage() {
  const router = useRouter();

  const { data: portfolioQuantum } = useFetchPortfolio<QuantumPortfolio>(QUANTUM_PORTFOLIO_URL, {
    retryOn304: true,
  });

  const handleAPIPress = (apiId: string) => {
    router.push(`/public-facing/api/${apiId}` as any);
  };

  const fallbackApis = useMemo(() => (apisData.apis ?? []) as ApiCardItem[], []);
  const apis: ApiCardItem[] = portfolioQuantum?.api
    ? [
        {
          ...portfolioQuantum.api,
          endpoints: Array.isArray(portfolioQuantum.endpoints) ? portfolioQuantum.endpoints.length : undefined,
        },
      ]
    : fallbackApis;

  return (
    <PublicFacingIndexWrapper
      title="Public APIs"
      leadBody="The internet’s interconnectivity depends on APIs. It’s collaboration in action. I enjoy the resources available via existing APIs for developers to use, and this is my contribution to that process. PokeAPI (Pokémon), SWAPI (Star Wars), and OpenAI are just a few of the tools that I call."
      leadSubBody="NGINX helps me host these endpoints on my VPS at DavidJGrimsley.com/whatever-i-want. This allows me to use the SSL that my website uses for HTTPS calls, which is super important in production. Please view each info page for how-to-use details and rate limits. Contact me for any problems or raise an issue on GitHub."
      seo={{
        title: 'Public APIs',
        description:
          'Explore public APIs built and hosted by David Grimsley. Learn what an API is, how to call endpoints, and view documentation, uptime, and rate limits.',
        path: '/public-facing/api',
        keywords: [
          'public API',
          'API portfolio',
          'what is an API',
          'REST API',
          'backend development',
          'NGINX',
          'developer tools',
        ],
        type: 'website',
      }}
    >

      <WhatIsAPICard />
      {apis.map((api) => (
        <SoftwareCard
          key={api.id}
          item={api}
          stats={[
            { emoji: '📡', label: `${typeof api.endpoints === 'number' ? api.endpoints : '—'} endpoints` },
            { emoji: '⚡', label: `${typeof api.uptime === 'string' ? api.uptime : '—'} uptime` },
          ]}
          onPress={() => handleAPIPress(api.id)}
        />
      ))}

      <ComingSoonCard
        title="More APIs Coming Soon"
        description="Stay tuned for additional public APIs covering authentication, data processing, and more."
      />
    </PublicFacingIndexWrapper>
  );
}
