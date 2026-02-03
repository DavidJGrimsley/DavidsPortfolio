/**
 * API Route: /api/portfolio/[id]
 * Resolves a server ID to its portfolioUrl and fetches the portfolio data
 */
import type { RegistryResponse, RegistryServer, Portfolio, APIPortfolio, MCPPortfolio } from '@/types/registry';

const REGISTRY_URL = 'https://davidjgrimsley.com/secret/registry.json';

// Fallback registry for ID → portfolioUrl resolution
const FALLBACK_REGISTRY: RegistryServer[] = [
  {
    id: 'quantum-echo-api',
    type: 'api',
    portfolioUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/portfolio.json',
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
];

// Fallback portfolio data for known IDs
const FALLBACK_PORTFOLIOS: Record<string, Portfolio> = {
  'quantum-echo-api': {
    api: {
      id: 'quantum-echo-api',
      name: 'Quantum API',
      version: '1.0.0',
      icon: '⚛️',
      description: 'General-purpose quantum computing services for games and applications. Run real quantum circuits using Qiskit Aer Simulator.',
      baseUrl: 'https://davidjgrimsley.com/public-facing/api/quantum',
      docsUrl: 'https://davidjgrimsley.com/public-facing/api/quantum/docs',
      status: 'active',
      featured: true,
      tags: ['quantum', 'simulation', 'gaming', 'text-processing'],
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
        description: 'Apply quantum-inspired transformations to text strings.',
      },
      {
        method: 'GET',
        path: '/quantum_echo_types',
        summary: 'List available transformation types',
        description: 'Get a list of all available quantum text transformation types.',
      },
    ],
  } as APIPortfolio,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

async function getRegistry(): Promise<RegistryServer[]> {
  try {
    const response = await fetch(REGISTRY_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Registry fetch failed: ${response.status}`);
    const data: RegistryResponse = await response.json();
    return data.servers;
  } catch {
    return FALLBACK_REGISTRY;
  }
}

export async function GET(
  request: Request,
  { id }: { id: string }
) {
  try {
    // Find the server entry in registry
    const servers = await getRegistry();
    const server = servers.find((s) => s.id === id);

    if (!server) {
      return Response.json(
        {
          success: false,
          error: `Server with ID "${id}" not found in registry`,
          availableIds: servers.map((s) => s.id),
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch the portfolio from the portfolioUrl
    const portfolioResponse = await fetch(server.portfolioUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      // Allow 304 handling
      cache: 'no-store',
    });

    // Handle 304 by retrying with cache bust
    const finalResponse =
      portfolioResponse.status === 304
        ? await fetch(`${server.portfolioUrl}?_=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
          })
        : portfolioResponse;

    if (!finalResponse.ok) {
      throw new Error(`Portfolio fetch failed: ${finalResponse.status}`);
    }

    const portfolio: Portfolio = await finalResponse.json();

    return Response.json(
      {
        success: true,
        data: {
          portfolio,
          registryEntry: server,
        },
        fetchedAt: new Date().toISOString(),
        source: 'live',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[API /portfolio/${id}] Error:`, error);

    // Try fallback portfolio
    const fallbackPortfolio = FALLBACK_PORTFOLIOS[id];
    const fallbackServer = FALLBACK_REGISTRY.find((s) => s.id === id);

    if (fallbackPortfolio && fallbackServer) {
      return Response.json(
        {
          success: true,
          data: {
            portfolio: fallbackPortfolio,
            registryEntry: fallbackServer,
          },
          fetchedAt: new Date().toISOString(),
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
