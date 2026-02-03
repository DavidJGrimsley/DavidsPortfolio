import React, { Suspense, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLoaderData, ErrorBoundaryProps } from 'expo-router';
import Head from 'expo-router/head';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';
import { WhatIsMCPCard } from '~/src/components/PublicFacing/mcp/WhatIsMCPCard';
import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
import type { RegistryResponse, MCPPortfolio } from '~/src/types/registry';
import LottieView from 'lottie-react-native';

// =============================================================================
// TYPES
// =============================================================================

type MCPCardItem = {
  id: string;
  name: string;
  version: string;
  icon: string;
  description: string;
  status: string;
  featured?: boolean;
  tags: string[];
  resources?: number;
  tools?: number;
  prompts?: number;
};

type LoaderData = {
  servers: MCPCardItem[];
  error?: string;
  loadedAt: string;
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
  
  const registryRes = await fetch(`${origin}/api/registry?type=mcp`, {
    cache: 'no-store',
  });
  
  if (!registryRes.ok) {
    throw new Error(`Registry fetch failed: ${registryRes.status}`);
  }
  
  const response = await registryRes.json();
  const registry: RegistryResponse = response.data || response;
  const mcpServers = registry.servers || [];
  
  if (mcpServers.length === 0) {
    throw new Error('No MCP servers found in registry');
  }
  
  const mcpPromises = mcpServers.map(async (server) => {
    try {
      const portfolioRes = await fetch(`${origin}/api/portfolio/${server.id}`, {
        cache: 'no-store',
      });
      if (!portfolioRes.ok) {
        console.warn(`Portfolio fetch failed for ${server.id}`);
        return null;
      }
      const portfolioResponse = await portfolioRes.json();
      const portfolio: MCPPortfolio = portfolioResponse?.data?.portfolio ?? portfolioResponse;
      const mcpInfo = portfolio?.mcp ?? (portfolio as { server?: MCPPortfolio['mcp'] })?.server;
      
      if (!portfolio || !mcpInfo) {
        console.warn(`Invalid portfolio structure for ${server.id}`);
        return null;
      }
      
      return {
        id: server.id,
        name: mcpInfo.name || server.id,
        version: mcpInfo.version || '1.0.0',
        icon: mcpInfo.icon ?? '',
        description: mcpInfo.description ?? '',
        status: mcpInfo.status || 'active',
        featured: mcpInfo.featured ?? false,
        tags: mcpInfo.tags ?? [],
        resources: portfolio.resources?.length ?? 0,
        tools: portfolio.tools?.length ?? 0,
        prompts: portfolio.prompts?.length ?? 0,
      } as MCPCardItem;
    } catch (err) {
      console.warn(`Error fetching portfolio for ${server.id}:`, err);
      return null;
    }
  });
  
  const results = await Promise.all(mcpPromises);
  const servers = results.filter((s): s is MCPCardItem => s !== null);
  
  if (servers.length === 0) {
    throw new Error('No valid MCP servers found');
  }
  
  return {
    servers,
    loadedAt: new Date().toISOString(),
  };
}

// =============================================================================
// LOADING COMPONENT
// =============================================================================
function CosmosLoading({ label }: { label?: string }) {
  return (
    <View className="w-full items-center justify-center min-h-100">
      <View className="w-[80%] aspect-square">
        <LottieView
          source={require('../../../../../assets/lottie/Cosmos.json')}
          autoPlay
          loop
          enableMergePathsAndroidForKitKatAndAbove
          resizeMode="contain"
        />
      </View>
      {label ? <Text className="text-gray-400 mt-4">{label}</Text> : null}
    </View>
  );
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-gray-900">
      <Text className="text-2xl font-bold text-red-400 mb-4">
        Failed to load MCP Servers
      </Text>
      <Text className="text-gray-400 text-center">
        {error.message}
      </Text>
      <Text className='text-gray-800 text-2xl' onPress={retry}>Try again</Text>
    </View>
  );
}

// =============================================================================
// SEO CONSTANTS
// =============================================================================
const seoTitle = 'MCP Servers | Model Context Protocol | David Grimsley Portfolio';
const seoDescription = 
  'Explore MCP (Model Context Protocol) servers by David Grimsley. Open-source implementations exposing development guides, architecture patterns, and structured resources for AI-powered code assistance. MCP servers for React Native, Expo Router, full-stack development, and more.';
const seoKeywords = 
  'MCP, Model Context Protocol, MCP server, AI tools, Pokemon MCP, developer resources, React Native MCP, Expo Router MCP, AI code assistance, structured knowledge, open-source MCP, developer documentation, software engineering, David Grimsley, mrdj-app-mcp, AI assistant integration';
const seoImage = 'https://davidjgrimsley.com/images/icon.png';
const seoUrl = 'https://davidjgrimsley.com/public-facing/mcp';
// =============================================================================
// PAGE COMPONENT - SSR DATA LOADER
// =============================================================================
export default function MCPListPage() {
  const [canRenderList, setCanRenderList] = useState(true);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const store = (globalThis as unknown as { __EXPO_ROUTER_LOADER_DATA__?: Record<string, LoaderData> })
      .__EXPO_ROUTER_LOADER_DATA__;

    if (store?.['/index']) return;

    const matchKey = store && Object.keys(store).find(
      (key) => key === '/public-facing/mcp' || key === '/public-facing/mcp/index'
    );

    if (store && matchKey) {
      store['/index'] = store[matchKey];
      return;
    }

    setCanRenderList(false);
    fetch('/_expo/loaders/public-facing/mcp/index', {
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Loader fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data: LoaderData) => {
        const target = (globalThis as unknown as { __EXPO_ROUTER_LOADER_DATA__?: Record<string, LoaderData> })
          .__EXPO_ROUTER_LOADER_DATA__ ||= {};
        target['/index'] = data;
        setCanRenderList(true);
      })
      .catch((err) => {
        setPreloadError(err instanceof Error ? err.message : 'Failed to preload loader data');
        setCanRenderList(true);
      });
  }, []);

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={seoImage} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={seoUrl} />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={seoDescription} />
        <meta property="twitter:image" content={seoImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoUrl} />
        
        {/* Additional SEO */}
        <meta name="author" content="David Grimsley" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Structured Data - CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "MCP Servers",
            "description": seoDescription,
            "url": seoUrl,
            "author": {
              "@type": "Person",
              "name": "David Grimsley",
              "url": "https://davidjgrimsley.com/"
            },
            "publisher": {
              "@type": "Person",
              "name": "David Grimsley",
              "url": "https://davidjgrimsley.com"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://davidjgrimsley.com/public-facing"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "MCP Servers",
                  "item": seoUrl
                }
              ]
            }
          })}
        </script>
      </Head>
      
      <PublicFacingIndexWrapper
        title="MCP Servers"
        leadBody="Using advanced models like Claude Sonnet and OpenAI allows me to leverage the speed and effectiveness of agentic coding, while my solid understanding of programming fundamentals, UI/UX principles, and data flow keeps projects actually working and makes architecture design and debugging my strong suit. It's important to keep the AI agent in check. This is just one use of an MCP. I also made an MCP focused on Pokemon, which includes guides written by me and a full database of Pokemon information."
        leadSubBody="NGINX helps me host these endpoints on my VPS at DavidJGrimsley.com/whatever-i-want. This allows me to use the SSL that my website uses for HTTPS calls, which is super important in production. Please view each info page for how-to-use details and rate limits. Contact me for any problems or raise an issue on GitHub."
      >
        
        {/* What is MCP? Info Card */}
        <WhatIsMCPCard />

        {/* Server list from loader data */}
        {preloadError ? (
          <View className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-4">
            <Text className="text-red-400 text-center">{preloadError}</Text>
          </View>
        ) : null}

        {!canRenderList ? (
          <CosmosLoading label="Loading MCP Servers..." />
        ) : (
          <Suspense fallback={<CosmosLoading label="Loading MCP Servers..." />}>
            <MCPList />
          </Suspense>
        )}
      </PublicFacingIndexWrapper>
    </>
  );
}

function MCPList() {
  const data = useLoaderData<typeof loader>();
  const router = useRouter();

  return (
    <>
      {data.servers.map((server) => (
        <SoftwareCard
          key={server.id}
          item={server}
          stats={[
            { emoji: '', label: `${typeof server.resources === 'number' ? server.resources : ''} resources` },
            { emoji: '', label: `${typeof server.tools === 'number' ? server.tools : ''} tools` },
            { emoji: '', label: `${typeof server.prompts === 'number' ? server.prompts : ''} prompts` },
          ]}
          onPress={() => router.push(`/public-facing/mcp/${server.id}` as any)}
        />
      ))}
    </>
  );
}
