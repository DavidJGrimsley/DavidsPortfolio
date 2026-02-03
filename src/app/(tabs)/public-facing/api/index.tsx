import React, { Suspense, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLoaderData, usePathname } from 'expo-router';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';
import { ComingSoonCard } from '~/src/components/PublicFacing/ComingSoonCard';
import { WhatIsAPICard } from '~/src/components/PublicFacing/api/WhatIsAPICard';
import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
import type { RegistryResponse, APIPortfolio } from '~/src/types/registry';
import apisData from '@json/apis.json';

// =============================================================================
// FALLBACK DATA (for static export or when registry unavailable)
// =============================================================================
const FALLBACK_APIS = (apisData.apis ?? []) as ApiCardItem[];

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

type LoaderData = {
  apis: ApiCardItem[];
  error?: string;
  fromCache: boolean;
  loadedAt: string;
  method: 'data-loader' | 'fallback';
};

type LoaderRequest = {
  url?: string;
};

function getRequestOrigin(request?: LoaderRequest) {
  if (!request?.url) return null;
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

// =============================================================================
// SSR DATA LOADER
// =============================================================================
export async function loader(
  request: LoaderRequest | undefined,
  _params: Record<string, string | string[]>
): Promise<LoaderData> {
  const origin = getRequestOrigin(request) || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8082');
  
  try {
    // Use API route to avoid CORS issues
    const registryRes = await fetch(`${origin}/api/registry?type=api`, {
      cache: 'no-store',
    });
    if (!registryRes.ok) {
      throw new Error(`Registry fetch failed: ${registryRes.status}`);
    }
    
    const response = await registryRes.json();
    const registry: RegistryResponse = response.data || response; // Handle wrapped or direct response
    
    // Servers are already filtered by API route
    const apiServers = registry.servers || [];
    
    if (apiServers.length === 0) {
      console.warn('No API servers found in registry');
      return {
        apis: FALLBACK_APIS,
        fromCache: true,
        loadedAt: new Date().toISOString(),
        method: 'fallback',
      };
    }
    
    // Fetch portfolio data for each API server using portfolioUrl from registry
    const apiPromises = apiServers.map(async (server) => {
      try {
        const portfolioRes = await fetch(server.portfolioUrl, {
          cache: 'no-store',
        });
        if (!portfolioRes.ok) {
          console.warn(`Portfolio fetch failed for ${server.id}`);
          return null;
        }
        const portfolio: APIPortfolio = await portfolioRes.json();
        return {
          id: server.id,
          name: portfolio.api.name,
          version: portfolio.api.version,
          icon: portfolio.api.icon ?? '',
          description: portfolio.api.description ?? '',
          baseUrl: portfolio.api.baseUrl,
          docsUrl: portfolio.api.docsUrl,
          healthUrl: portfolio.api.healthUrl,
          status: portfolio.api.status,
          featured: portfolio.api.featured,
          tags: portfolio.api.tags ?? [],
          uptime: portfolio.api.uptime,
          endpoints: portfolio.endpoints?.length,
        } as ApiCardItem;
      } catch (err) {
        console.warn(`Error fetching portfolio for ${server.id}:`, err);
        return null;
      }
    });
    
    const results = await Promise.all(apiPromises);
    const apis = results.filter((api): api is ApiCardItem => api !== null);
    
    return {
      apis: apis.length > 0 ? apis : FALLBACK_APIS,
      fromCache: apis.length === 0,
      loadedAt: new Date().toISOString(),
      method: 'data-loader',
    };
  } catch (error) {
    console.error('Loader error:', error);
    return {
      apis: FALLBACK_APIS,
      error: error instanceof Error ? error.message : 'Unknown error',
      fromCache: true,
      loadedAt: new Date().toISOString(),
      method: 'fallback',
    };
  }
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-gray-900">
      <Text className="text-2xl font-bold text-red-400 mb-4">
        Failed to load APIs
      </Text>
      <Text className="text-gray-400 text-center">
        {error.message}
      </Text>
    </View>
  );
}

// =============================================================================
// LOADING FALLBACK
// =============================================================================
function LoadingFallback() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-gray-900">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-gray-400 mt-4">Loading APIs...</Text>
    </View>
  );
}

// =============================================================================
// PAGE CONTENT (uses loader data)
// =============================================================================
function APIListContent() {
  const pathname = usePathname();
  const fallbackData: LoaderData = {
    apis: FALLBACK_APIS,
    fromCache: true,
    loadedAt: new Date().toISOString(),
    method: 'fallback',
  };

  if (typeof window !== 'undefined') {
    const store = ((globalThis as unknown as { __EXPO_ROUTER_LOADER_DATA__?: Record<string, LoaderData> })
      .__EXPO_ROUTER_LOADER_DATA__ ||= {});
    const keys = new Set<string>();
    if (pathname) {
      keys.add(pathname);
      keys.add(pathname === '/' ? '/index' : `${pathname}/index`);
    }
    keys.add('/index');
    keys.forEach((key) => {
      if (!store[key]) {
        store[key] = fallbackData;
      }
    });
  }

  const data = useLoaderData<typeof loader>() as LoaderData | undefined;
  const { apis, fromCache, error } = data ?? fallbackData;
  const [liveApis, setLiveApis] = useState<ApiCardItem[] | null>(null);
  const [liveError, setLiveError] = useState<string | undefined>();
  const router = useRouter();

  const handleAPIPress = (apiId: string) => {
    router.push(`/public-facing/api/${apiId}` as any);
  };

  useEffect(() => {
    if (!fromCache) return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchLive = async () => {
      try {
        const registryRes = await fetch('/api/registry?type=api', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!registryRes.ok) {
          throw new Error(`Registry fetch failed: ${registryRes.status}`);
        }

        const response = await registryRes.json();
        const registry: RegistryResponse = response.data || response; // Handle wrapped or direct response
        const apiServers = registry.servers || [];

        if (apiServers.length === 0) {
          throw new Error('No API servers found in registry');
        }

        const items = await Promise.all(
          apiServers.map(async (server) => {
            const portfolioRes = await fetch(server.portfolioUrl, {
              signal: controller.signal,
              cache: 'no-store',
            });

            let status = true;
            if (!portfolioRes.ok) {
              status = false;
              throw new Error(`Portfolio fetch failed: ${portfolioRes.status}`);
            }

            const portfolio: APIPortfolio = await portfolioRes.json();
            return {
              id: server.id,
              name: portfolio.api.name,
              version: portfolio.api.version,
              icon: portfolio.api.icon ?? '',
              description: portfolio.api.description ?? '',
              baseUrl: portfolio.api.baseUrl,
              docsUrl: portfolio.api.docsUrl,
              healthUrl: portfolio.api.healthUrl,
              status: status ? 'active' : 'inactive',
              featured: portfolio.api.featured,
              tags: portfolio.api.tags ?? [],
              uptime: portfolio.api.uptime,
              endpoints: portfolio.endpoints?.length,
            } as ApiCardItem;
          })
        );

        if (isMounted) {
          setLiveApis(items);
          setLiveError(undefined);
        }
      } catch (err) {
        if (isMounted) {
          setLiveError(err instanceof Error ? err.message : 'Failed to fetch live data');
        }
      }
    };

    fetchLive();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fromCache]);

  const displayApis = (liveApis && liveApis.length > 0 ? liveApis : apis) || [];

  return (
    <PublicFacingIndexWrapper
      title="Public APIs"
      leadBody="The internet's interconnectivity depends on APIs. It's collaboration in action. I enjoy the resources available via existing APIs for developers to use, and this is my contribution to that process. PokeAPI (Pokémon), SWAPI (Star Wars), and OpenAI are just a few of the tools that I call."
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
      {/* Show cache indicator if data is from fallback */}
      {fromCache && !liveApis && (
        <View className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mb-4">
          <Text className="text-yellow-400 text-sm text-center">
            📡 Showing cached data{(liveError || error) ? ` (${liveError ?? error})` : ''}
          </Text>
        </View>
      )}

      <WhatIsAPICard />
      
      {displayApis.map((api) => (
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

// =============================================================================
// DEFAULT EXPORT (wrapped in Suspense)
// =============================================================================
export default function APIIndexPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <APIListContent />
    </Suspense>
  );
}
