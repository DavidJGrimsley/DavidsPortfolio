import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SoftwareCard } from '@/components/SoftwareDev/SoftwareCard';
import { ComingSoonCard } from '@/components/SoftwareDev/ComingSoonCard';
import { WhatIsAPICard } from '@/components/SoftwareDev/api/WhatIsAPICard';
import { useFetchPortfolio } from '@/hooks/useFetchPortfolio';
import apisData from '@json/apis.json';

const QUANTUM_BASE_URL = 'https://davidjgrimsley.com/api/quantum';
const QUANTUM_PORTFOLIO_URL = `${QUANTUM_BASE_URL}/portfolio.json`;

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
  endpoints: Array<{
    method: string;
    path: string;
    summary: string;
    description?: string;
  }>;
};

export default function APIIndexPage() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  const { data: portfolioQuantum } = useFetchPortfolio<QuantumPortfolio>(QUANTUM_PORTFOLIO_URL, {
    retryOn304: true,
  });

  const handleAPIPress = (apiId: string) => {
    router.push(`/public-facing/api/${apiId}` as any);
  };

  const fallbackApis = useMemo(() => apisData.apis ?? [], []);
  const apis = portfolioQuantum?.api
    ? [
        {
          ...portfolioQuantum.api,
          endpoints: Array.isArray(portfolioQuantum.endpoints) ? portfolioQuantum.endpoints.length : 0,
        },
      ]
    : fallbackApis;

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {/* Title Section */}
      <View className="px-5 pt-10 pb-5">
        <ThemedText type="title" className="mb-2 text-[4%] leading-[4.8%]">
          Public APIs
        </ThemedText>
        <ThemedText className="opacity-70 text-[2%] leading-[2.8%]">
          Open APIs hosted by David Grimsley for public use
        </ThemedText>
      </View>

      <ScrollView 
        contentContainerClassName="px-5 pb-10 gap-4"
      >
        {apis.map((api) => (
          <SoftwareCard
            key={api.id}
            item={api}
            stats={[
              { emoji: '📡', label: `${api.endpoints} endpoints` },
              { emoji: '⚡', label: `${api.uptime} uptime` },
            ]}
            onPress={() => handleAPIPress(api.id)}
          />
        ))}

        <WhatIsAPICard />

        <ComingSoonCard
          title="More APIs Coming Soon"
          description="Stay tuned for additional public APIs covering authentication, data processing, and more."
        />
      </ScrollView>
    </View>
  );
}
