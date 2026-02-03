/**
 * Dynamic API Detail Page with SSR Data Loader
 * Route: /public-facing/api/[id]
 * 
 * Uses Expo Router data loaders to fetch portfolio data server-side,
 * enabling SEO-friendly rendering with data embedded in HTML.
 */
import React, { Suspense, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Link, useLoaderData, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EndpointCard } from '~/src/components/PublicFacing/api/APIComponents';
import { PublicFacingDetailWrapper } from '~/src/components/PublicFacing/PublicFacingDetailWrapper';
import { PortfolioHeader, SyncStatus } from '~/src/components/PublicFacing/PortfolioShared';
import { HelloWave } from '@/components/QuantumAnimation';
import type { APIPortfolio, RegistryServer } from '@/types/registry';

// Fallback data for static export
const FALLBACK_API: APIPortfolio = {
  api: {
    id: 'quantum-echo-api',
    name: 'Quantum API',
    version: '1.0.0',
    icon: '⚛️',
    description: 'General-purpose quantum computing services for games and applications.',
    baseUrl: 'https://davidjgrimsley.com/public-facing/api/quantum',
    docsUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/docs',
    status: 'active',
    featured: true,
    tags: ['quantum', 'simulation', 'gaming'],
  },
  endpoints: [
    {
      method: 'POST',
      path: '/quantum_gate',
      summary: 'Apply quantum gate operation',
      description: 'Execute a quantum gate operation on a single qubit.',
    },
    {
      method: 'POST',
      path: '/quantum_text',
      summary: 'Transform text using quantum effects',
    },
    {
      method: 'GET',
      path: '/quantum_echo_types',
      summary: 'List available transformation types',
    },
  ],
};

type LoaderRequest = {
  url?: string;
};

interface PortfolioApiResponse {
  success: boolean;
  data: {
    portfolio: APIPortfolio;
    registryEntry: RegistryServer;
  };
  fetchedAt: string;
  source: 'live' | 'fallback';
  error?: string;
}

type DetailData = {
  portfolio: APIPortfolio;
  registryEntry: RegistryServer;
  loadedAt: string;
  source: 'live' | 'fallback';
  params: { id: string };
  method: 'data-loader' | 'fallback';
};

function getRequestOrigin(request?: LoaderRequest) {
  if (!request?.url) return null;
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

// Server-side data loader
export async function loader(
  request: LoaderRequest | undefined,
  params: Record<string, string | string[]>
) {
  const origin = getRequestOrigin(request);
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (origin) {
    try {
      const response = await fetch(`${origin}/api/portfolio/${encodeURIComponent(id ?? '')}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: PortfolioApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio');
      }

      // Verify this is an API type
      if (!('api' in result.data.portfolio)) {
        throw new Error('Invalid portfolio type: expected API');
      }

      return {
        portfolio: result.data.portfolio as APIPortfolio,
        registryEntry: result.data.registryEntry,
        loadedAt: result.fetchedAt,
        source: result.source,
        params: { id: id ?? '' },
        method: 'data-loader' as const,
      };
    } catch (error) {
      console.error(`[Loader /api/${id}] Error:`, error);
      throw error;
    }
  }

  // Static export fallback
  return {
    portfolio: FALLBACK_API,
    registryEntry: {
      id: id ?? 'quantum-echo-api',
      type: 'api' as const,
      portfolioUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/portfolio.json',
    },
    loadedAt: new Date().toISOString(),
    source: 'fallback' as const,
    params: { id: id ?? '' },
    method: 'data-loader' as const,
  };
}

// Error boundary for loader failures
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const accentColor = useThemeColor({}, 'accent');

  return (
    <ScrollView
      contentContainerClassName="flex-1 justify-center items-center p-6"
      style={{ backgroundColor: accentColor }}
    >
      <ThemedText className="text-5xl mb-4">❌</ThemedText>
      <ThemedText type="title" className="mb-2 text-center">
        Error Loading API
      </ThemedText>
      <ThemedText className="opacity-80 text-center mb-6">{error.message}</ThemedText>

      <Pressable
        onPress={retry}
        className="bg-tint px-6 py-3 rounded-lg mb-4"
      >
        <ThemedText className="text-white font-bold">Retry</ThemedText>
      </Pressable>

      <Link href="/public-facing/api" className="opacity-70">
        <ThemedText>← Back to APIs</ThemedText>
      </Link>
    </ScrollView>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <View className="flex-1 justify-center items-center p-6">
      <ActivityIndicator size="large" />
      <ThemedText className="mt-4 opacity-70">Loading API details...</ThemedText>
    </View>
  );
}

// Main content component using loader data
function APIDetailContent() {
  const pathname = usePathname();
  const slug = pathname?.split('/').filter(Boolean).pop();
  
  // Inject fallback data for this route
  if (typeof window !== 'undefined') {
    const store = ((globalThis as unknown as { __EXPO_ROUTER_LOADER_DATA__?: Record<string, any> })
      .__EXPO_ROUTER_LOADER_DATA__ ||= {});
    const keys = new Set<string>();
    if (pathname) {
      keys.add(pathname);
      if (slug) {
        keys.add(`/${slug}`);
        keys.add(`/public-facing/api/${slug}`);
        keys.add(`/public-facing/api/${slug}/index`);
      }
    }
    keys.add('/public-facing/api/[id]');
    keys.add('/[id]');
    keys.forEach((key) => {
      if (!store[key]) {
        store[key] = {
          portfolio: FALLBACK_API,
          registryEntry: {
            id: 'quantum-echo-api',
            type: 'api',
            portfolioUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/portfolio.json',
          },
          source: 'fallback',
          loadedAt: new Date().toISOString(),
        };
      }
    });
  }
  
  const fallbackDetail: DetailData = {
    portfolio: FALLBACK_API,
    registryEntry: {
      id: slug ?? 'quantum-echo-api',
      type: 'api' as const,
      portfolioUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/portfolio.json',
    },
    loadedAt: new Date().toISOString(),
    source: 'fallback' as const,
    params: { id: slug ?? 'quantum-echo-api' },
    method: 'fallback' as const,
  };

  const data = (useLoaderData<typeof loader>() as DetailData) ?? fallbackDetail;
  const [liveDetail, setLiveDetail] = useState<DetailData | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || data.source === 'live') return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchLive = async () => {
      try {
        const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: PortfolioApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch portfolio');
        }

        const portfolio = result.data.portfolio as APIPortfolio;
        const detail: DetailData = {
          portfolio,
          registryEntry: result.data.registryEntry,
          loadedAt: result.fetchedAt ?? new Date().toISOString(),
          source: result.source ?? 'live',
          params: { id: slug },
          method: 'data-loader',
        };

        if (isMounted) {
          setLiveDetail(detail);
          setLiveError(null);
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
  }, [slug, data.source]);

  const detail = liveDetail ?? data;
  const { portfolio, registryEntry, source, loadedAt } = detail;
  const { api } = portfolio;
  const endpoints = portfolio.endpoints ?? [];

  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');

  const [isHowToUseExpanded, setIsHowToUseExpanded] = useState(false);
  const [isQuantumMechanicsExpanded, setIsQuantumMechanicsExpanded] = useState(false);

  const statusRaw = (api.status ?? '').toLowerCase();
  const isLive =
    source === 'live' &&
    (statusRaw === 'active' || statusRaw === 'healthy' || statusRaw === 'live');

  const isSynced = source === 'live';

  const seoTitle = `${api.name} API | David Grimsley`;
  const seoDescription =
    api.description ??
    `${api.name} is a public API hosted by David Grimsley. View endpoints, docs, examples, and usage notes.`;

  // Check if this is the quantum API for special sections
  const isQuantumApi = api.id === 'quantum-echo-api' || api.name.toLowerCase().includes('quantum');

  if (source !== 'live' && !liveDetail) {
    return (
      <PublicFacingDetailWrapper
        seo={{
          title: seoTitle,
          description: seoDescription,
          path: `/public-facing/api/${api.id}`,
          keywords: [
            api.name,
            'public API',
            'REST API',
            'developer tools',
            ...(api.tags ?? []),
          ],
          type: 'website',
        }}
      >
        <View className="rounded-lg p-5 bg-yellow-900/30 border border-yellow-600/50">
          <ThemedText type="defaultSemiBold" className="mb-2 text-yellow-400">
            Live data is unavailable
          </ThemedText>
          <ThemedText className="opacity-90">
            {liveError ?? 'The server isn’t responding right now. Please try again in a few minutes.'}
          </ThemedText>
        </View>
      </PublicFacingDetailWrapper>
    );
  }

  return (
    <PublicFacingDetailWrapper
      seo={{
        title: seoTitle,
        description: seoDescription,
        path: `/public-facing/api/${api.id}`,
        keywords: [
          api.name,
          'public API',
          'REST API',
          'developer tools',
          ...(api.tags ?? []),
        ],
        type: 'website',
      }}
    >
      {/* Header */}
      <PortfolioHeader
        name={api.name}
        version={api.version}
        description={api.description}
        icon={api.icon}
        iconName="cloud"
        isLive={isLive}
        baseUrl={api.baseUrl}
        docsUrl={api.docsUrl}
        tags={api.tags}
        isSynced={isSynced}
        type="api"
      />

      {/* Endpoints Section */}
      <View className="mb-7.5">
        <ThemedText type="subtitle" className="mb-4">
          📡 Endpoints
        </ThemedText>

        {endpoints.map((endpoint: APIPortfolio['endpoints'][number]) => {
          const normalizedMethod = String(endpoint.method ?? 'GET').toUpperCase();
          const methodForCard =
            normalizedMethod === 'GET' ||
            normalizedMethod === 'POST' ||
            normalizedMethod === 'PUT' ||
            normalizedMethod === 'DELETE' ||
            normalizedMethod === 'PATCH'
              ? normalizedMethod
              : 'GET';

          return (
            <EndpointCard
              key={`${normalizedMethod}:${endpoint.path}`}
              method={methodForCard as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'}
              path={endpoint.path}
              summary={endpoint.summary}
              description={endpoint.description}
              parameters={endpoint.parameters}
              requestBody={endpoint.requestBody}
              responses={endpoint.responses}
              baseUrl={api.baseUrl}
            />
          );
        })}
      </View>

      {/* Quantum-specific sections */}
      {isQuantumApi && (
        <>
          {/* Quantum Mechanics Explainer */}
          <View className="mb-7.5">
            <Pressable
              onPress={() => setIsQuantumMechanicsExpanded(!isQuantumMechanicsExpanded)}
              className={`p-4 rounded-lg ${isQuantumMechanicsExpanded ? 'mb-4' : ''}`}
              style={{ backgroundColor: accentColor }}
            >
              <View className="flex-row items-center justify-between">
                <ThemedText type="subtitle" style={{ color: textColor }}>
                  What is Quantum Mechanics?
                </ThemedText>
                <ThemedText style={{ color: textColor }}>
                  {isQuantumMechanicsExpanded ? '▼' : '▶'}
                </ThemedText>
              </View>
            </Pressable>

            {isQuantumMechanicsExpanded && (
              <View className="p-5 rounded-lg gap-4" style={{ backgroundColor: accentColor }}>
                <View>
                  <ThemedText type="defaultSemiBold" className="mb-2">
                    Understanding Quantum Mechanics
                  </ThemedText>
                  <ThemedText className="opacity-90 leading-relaxed">
                    Quantum mechanics is the physics of the very small - atoms, electrons, and
                    photons. At this scale, particles behave very differently than in our everyday
                    world. They can exist in multiple states at once (superposition), be
                    mysteriously connected across distances (entanglement), and change when
                    observed (measurement collapse).
                  </ThemedText>
                </View>

                <View>
                  <ThemedText type="defaultSemiBold" className="mb-2">
                    How This API Works
                  </ThemedText>
                  <ThemedText className="opacity-90 leading-relaxed">
                    This API uses IBM&apos;s Qiskit library to simulate quantum circuits. When you
                    call the /quantum_gate endpoint, the server creates a quantum circuit, applies
                    a rotation gate (RY) at your chosen angle, then measures the qubit. The
                    measurement forces the quantum state to collapse into either 0 or 1, giving
                    you TRUE quantum randomness.
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* How to Use Section */}
          <View className="mb-7.5">
            <Pressable
              onPress={() => setIsHowToUseExpanded(!isHowToUseExpanded)}
              className={`p-4 rounded-lg ${isHowToUseExpanded ? 'mb-4' : ''}`}
              style={{ backgroundColor: accentColor }}
            >
              <View className="flex-row items-center justify-between">
                <ThemedText type="subtitle" style={{ color: textColor }}>
                  How to Use This API
                </ThemedText>
                <ThemedText style={{ color: textColor }}>
                  {isHowToUseExpanded ? '▼' : '▶'}
                </ThemedText>
              </View>
            </Pressable>

            {isHowToUseExpanded && (
              <View className="p-5 rounded-lg gap-4" style={{ backgroundColor: accentColor }}>
                <ThemedText className="opacity-90 leading-relaxed">
                  1. Choose an endpoint from the list above{'\n'}
                  2. Send a request with the required parameters{'\n'}
                  3. Parse the JSON response for your use case{'\n'}
                  4. Handle errors gracefully with retry logic
                </ThemedText>
              </View>
            )}
          </View>

          {/* Code Examples */}
          <View className="mb-7.5">
            <ThemedText type="subtitle" className="mb-4">
              💻 Code Examples
            </ThemedText>

            <View className="mb-5">
              <ThemedText type="defaultSemiBold" className="mb-2">
                JavaScript / TypeScript
              </ThemedText>
              <View className="p-4 rounded-lg bg-(--color-code-bg)">
                <ScrollView horizontal>
                  <ThemedText className="font-mono text-sm text-(--color-code-text) leading-relaxed">
                    {`const response = await fetch(
  '${api.baseUrl}/quantum_gate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gate_type: 'rotation',
      rotation_angle: Math.PI / 2
    })
  }
);

const result = await response.json();
console.log('Measurement:', result.measurement);`}
                  </ThemedText>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Live Demo */}
          <View className="mb-5">
            <ThemedText type="subtitle" className="mb-4">
              🎮 Live Demo
            </ThemedText>
            <View className="p-5 rounded-lg" style={{ backgroundColor: accentColor }}>
              <ThemedText className="opacity-90 text-center mb-4 leading-relaxed">
                💡 This is the actual quantum animation making a LIVE call to this API right now!
              </ThemedText>
              <HelloWave />
              <ThemedText className="opacity-85 text-center mt-4 italic leading-relaxed">
                Every time this loads, it calls POST /quantum_gate with a random rotation angle.
              </ThemedText>
            </View>
          </View>
        </>
      )}

      {/* Technical Details */}
      <View className="mb-7.5">
        <ThemedText type="subtitle" className="mb-4">
          🔬 Technical Details
        </ThemedText>
        <View className="p-4 rounded-lg" style={{ backgroundColor: accentColor }}>
          <View className="gap-3">
            <View>
              <ThemedText type="defaultSemiBold" className="mb-1">
                Status
              </ThemedText>
              <ThemedText className="opacity-85">{api.status}</ThemedText>
            </View>
            {api.uptime && (
              <View>
                <ThemedText type="defaultSemiBold" className="mb-1">
                  Uptime
                </ThemedText>
                <ThemedText className="opacity-85">{api.uptime}</ThemedText>
              </View>
            )}
            <View>
              <ThemedText type="defaultSemiBold" className="mb-1">
                Data Loaded
              </ThemedText>
              <ThemedText className="opacity-85">
                {new Date(loadedAt).toLocaleString()} ({source})
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Sync Status */}
      <SyncStatus isSynced={isSynced} sourceUrl={registryEntry.portfolioUrl} />
    </PublicFacingDetailWrapper>
  );
}

// Export default with Suspense wrapper
export default function APIDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <APIDetailContent />
    </Suspense>
  );
}
