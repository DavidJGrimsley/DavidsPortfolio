/**
 * API Route: /api/registry
 * Fetches the external registry of APIs and MCPs from davidjgrimsley.com
 */
import type { RegistryResponse } from '@/types/registry';

const REGISTRY_URL = 'https://davidjgrimsley.com/secret/registry.json';
const QUANTUM_ROUTE_ID = 'quantum';
const QUANTUM_LEGACY_IDS = new Set([QUANTUM_ROUTE_ID, 'quantum-echo-api']);
const QUANTUM_PUBLIC_BASE_PATH = '/api/public/quantum/v1';
const QUANTUM_PORTFOLIO_URL =
  `https://davidjgrimsley.com${QUANTUM_PUBLIC_BASE_PATH}/portfolio.json`;

// Fallback registry data in case external fetch fails
const FALLBACK_REGISTRY: RegistryResponse = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  servers: [
    {
      id: QUANTUM_ROUTE_ID,
      type: 'api',
      aliases: ['quantum-echo-api'],
      publicBasePath: QUANTUM_PUBLIC_BASE_PATH,
      portfolioUrl: QUANTUM_PORTFOLIO_URL,
    },
    {
      id: 'mrdj-app-mcp',
      type: 'mcp',
      portfolioUrl: 'https://davidjgrimsley.com/public-facing/mcp/mrdj-app-mcp/portfolio.json',
    },
    {
      id: 'mrdj-pokemon-mcp',
      type: 'mcp',
      portfolioUrl: 'https://davidjgrimsley.com/public-facing/mcp/mrdj-pokemon-mcp/portfolio.json',
    },
    {
      id: 'mrdj-fne-mcp',
      type: 'mcp',
      portfolioUrl: 'https://davidjgrimsley.com/public-facing/mcp/mrdj-fne-mcp/portfolio.json',
    },
  ],
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function normalizeRegistryServer(server: RegistryResponse['servers'][number]) {
  if (server.type === 'api' && QUANTUM_LEGACY_IDS.has(server.id)) {
    return {
      ...server,
      id: QUANTUM_ROUTE_ID,
      aliases: ['quantum-echo-api'],
      publicBasePath: QUANTUM_PUBLIC_BASE_PATH,
      portfolioUrl: QUANTUM_PORTFOLIO_URL,
    };
  }

  return server;
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type'); // 'api' | 'mcp' | null

    const response = await fetch(REGISTRY_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Registry fetch failed: ${response.status}`);
    }

    const registry: RegistryResponse = await response.json();
    const registryServers = Array.isArray(registry.servers)
      ? registry.servers.map(normalizeRegistryServer)
      : [];

    // Filter by type if requested
    const filteredServers = typeFilter
      ? registryServers.filter((s) => s.type === typeFilter)
      : registryServers;

    return Response.json(
      {
        success: true,
        data: {
          ...registry,
          servers: filteredServers,
        },
        fetchedAt: new Date().toISOString(),
        source: 'live',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API /registry] Error fetching registry:', error);

    // Return fallback data
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type');

    const filteredServers = typeFilter
      ? FALLBACK_REGISTRY.servers.filter((s) => s.type === typeFilter)
      : FALLBACK_REGISTRY.servers;

    return Response.json(
      {
        success: true,
        data: {
          ...FALLBACK_REGISTRY,
          servers: filteredServers,
        },
        fetchedAt: new Date().toISOString(),
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { headers: corsHeaders }
    );
  }
}
