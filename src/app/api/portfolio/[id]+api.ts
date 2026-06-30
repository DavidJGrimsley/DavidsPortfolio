import type { APIPortfolio, Portfolio, RegistryResponse, RegistryServer } from '@/types/registry';
import { MCP_FALLBACK_PORTFOLIOS } from '@/data/mcpFallbackPortfolios';

const REGISTRY_URL = 'https://davidjgrimsley.com/secret/registry.json';
const QUANTUM_ROUTE_ID = 'quantum';
const QUANTUM_LEGACY_IDS = new Set([QUANTUM_ROUTE_ID, 'quantum-echo-api']);
const QUANTUM_PUBLIC_BASE_PATH = '/api/public/quantum/v1';
const QUANTUM_CANONICAL_PORTFOLIO_URL =
  `https://davidjgrimsley.com${QUANTUM_PUBLIC_BASE_PATH}/portfolio.json`;
const QUANTUM_DOCS_URL = 'https://davidjgrimsley.com/public-facing/api/quantum/docs';

const FALLBACK_REGISTRY: RegistryServer[] = [
  {
    id: QUANTUM_ROUTE_ID,
    type: 'api',
    aliases: ['quantum-echo-api'],
    publicBasePath: QUANTUM_PUBLIC_BASE_PATH,
    portfolioUrl: QUANTUM_CANONICAL_PORTFOLIO_URL,
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

const FALLBACK_PORTFOLIOS: Record<string, Portfolio> = {
  [QUANTUM_ROUTE_ID]: decorateQuantumPortfolio(
    {
      api: {
        id: QUANTUM_ROUTE_ID,
        name: 'Quantum API',
        version: '0.1.0',
        description:
          'Production Quantum API with key lifecycle management and runtime endpoints for simulation and transformation workloads.',
        baseUrl: `https://davidjgrimsley.com${QUANTUM_PUBLIC_BASE_PATH}`,
        docsUrl: QUANTUM_DOCS_URL,
        healthUrl: `https://davidjgrimsley.com${QUANTUM_PUBLIC_BASE_PATH}/health`,
        status: 'active',
        featured: true,
        tags: ['quantum', 'simulation', 'security', 'api'],
        uptime: 'n/a',
      },
      endpoints: [
        {
          method: 'GET',
          path: '/v1/health',
          operationPath: '/v1/health',
          summary: 'Service health and runtime capability status',
          description:
            'Public liveness endpoint. Returns service status, version, and runtime availability details.',
          auth: 'public',
        },
        {
          method: 'GET',
          path: '/v1/echo-types',
          operationPath: '/v1/echo-types',
          summary: 'List canonical text transformation categories',
          description:
            'Returns transformation categories and descriptions used by text transformation clients.',
          auth: 'api_key',
        },
        {
          method: 'POST',
          path: '/v1/gates/run',
          operationPath: '/v1/gates/run',
          summary: 'Run a single-qubit gate and return measured output',
          description:
            'Supports bit_flip, phase_flip, and rotation gates. Rotation requests must include rotation_angle_rad.',
          auth: 'api_key',
          parameters: [
            {
              name: 'gate_type',
              type: 'string',
              required: true,
              description: "Gate to apply: 'bit_flip', 'phase_flip', or 'rotation'.",
              example: 'rotation',
              enum: ['bit_flip', 'phase_flip', 'rotation'],
            },
            {
              name: 'rotation_angle_rad',
              type: 'number',
              required: false,
              description: "Radians for rotation gate. Required only when gate_type is 'rotation'.",
              example: 1.5708,
              dependsOn: 'rotation',
            },
          ],
          requestBody: {
            description: 'Gate execution request payload.',
            example: {
              gate_type: 'rotation',
              rotation_angle_rad: Math.PI / 2,
            },
          },
        },
      ],
    },
    'https://davidjgrimsley.com'
  ),
  ...MCP_FALLBACK_PORTFOLIOS,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function normalizeRouteId(id: string) {
  return QUANTUM_LEGACY_IDS.has(id) ? QUANTUM_ROUTE_ID : id;
}

function isQuantumServer(server: RegistryServer) {
  return server.type === 'api' && QUANTUM_LEGACY_IDS.has(server.id);
}

function getRequestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function buildQuantumPortfolioUrl(origin: string | null) {
  return `${origin ?? 'https://davidjgrimsley.com'}${QUANTUM_PUBLIC_BASE_PATH}/portfolio.json`;
}

function normalizeRegistryServer(server: RegistryServer, origin?: string | null): RegistryServer {
  if (isQuantumServer(server)) {
    return {
      ...server,
      id: QUANTUM_ROUTE_ID,
      aliases: ['quantum-echo-api'],
      publicBasePath: QUANTUM_PUBLIC_BASE_PATH,
      portfolioUrl: buildQuantumPortfolioUrl(origin ?? null),
    };
  }

  return server;
}

function resolvePortfolioFetchUrl(server: RegistryServer, origin: string | null) {
  if (isQuantumServer(server) || normalizeRouteId(server.id) === QUANTUM_ROUTE_ID) {
    return buildQuantumPortfolioUrl(origin);
  }

  return server.portfolioUrl;
}

function getQuantumFeatures() {
  return [
    'True randomness from quantum measurement',
    'Simulator-backed requests work without IBM credentials',
    'BYO IBM credentials unlock hardware workflows',
    'Interactive endpoint testing from the portfolio page',
    'Runtime proxy support for production web clients',
  ];
}

function getQuantumSections(baseUrl: string) {
  return [
    {
      id: 'quantum-mechanics',
      title: 'What is Quantum Mechanics?',
      collapsible: true,
      body: [
        'Quantum mechanics is the physics of very small systems. This API uses Qiskit to prepare circuits, run simulator-backed measurements, and optionally send jobs to IBM hardware when a user brings their own IBM credentials.',
        'A qubit can be prepared in a superposition, then measurement collapses it into a classical result. That measured result drives endpoint responses and the live animation below.',
      ],
    },
    {
      id: 'how-to-use',
      title: 'How to Use This API',
      collapsible: true,
      body:
        'Public routes such as /health can be called directly. Runtime endpoints such as /gates/run use an API key, which you can create and manage in the dashboard on this page. IBM hardware features require signing in and adding your own IBM credentials.',
      links: [
        {
          label: `${baseUrl}/health`,
          href: `${baseUrl}/health`,
        },
      ],
    },
    {
      id: 'code-example',
      title: 'Code Examples',
      body: 'This example calls a runtime endpoint with an API key generated from the dashboard.',
      code: {
        language: 'ts',
        value: `const response = await fetch(
  '${baseUrl}/gates/run',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '<your_api_key>'
    },
    body: JSON.stringify({
      gate_type: 'rotation',
      rotation_angle_rad: Math.PI / 2
    })
  }
);

const result = await response.json();
console.log('Measurement:', result.measurement);`,
      },
    },
  ];
}

function decorateQuantumPortfolio(portfolio: APIPortfolio, origin: string | null): APIPortfolio {
  const baseUrl = `${origin ?? 'https://davidjgrimsley.com'}${QUANTUM_PUBLIC_BASE_PATH}`;
  const endpoints = (portfolio.endpoints ?? []).map((endpoint) => {
    const operationPath = endpoint.operationPath ?? endpoint.path;
    const normalizedOperationPath = operationPath.split('?')[0];

    if (endpoint.method.toUpperCase() === 'GET' && normalizedOperationPath === '/v1/list_backends') {
      return {
        ...endpoint,
        liveTestPath: '/v1/list_backends?provider=aer&simulator_only=true',
      };
    }

    if (operationPath.includes('{') || operationPath.includes('}')) {
      return {
        ...endpoint,
        liveTestDisabledReason:
          endpoint.liveTestDisabledReason ??
          'This endpoint needs a concrete resource identifier before it can be tested from the portfolio page.',
      };
    }

    return endpoint;
  });

  return {
    ...portfolio,
    api: {
      ...portfolio.api,
      id: QUANTUM_ROUTE_ID,
      baseUrl,
      publicBasePath: QUANTUM_PUBLIC_BASE_PATH,
      docsUrl: portfolio.api.docsUrl || QUANTUM_DOCS_URL,
      healthUrl: `${baseUrl}/health`,
      icon: undefined,
      iconName: 'nuclear',
      features: portfolio.api.features ?? getQuantumFeatures(),
      liveTestExecutor: 'quantum-sdk',
      auth: {
        ...portfolio.api.auth,
        apiKey: true,
        bearerJwt: true,
        showApiKeyDashboard: true,
        supportsIbmProfiles: true,
        provider: portfolio.api.auth?.provider ?? 'supabase',
        dashboardDescription:
          portfolio.api.auth?.dashboardDescription ??
          'Obtain API keys to use Quantum API runtime endpoints. There are rate limits applied to each key. New secrets are shown once, then stored only as masked metadata.',
      },
    },
    endpoints,
    sections: portfolio.sections ?? getQuantumSections(baseUrl),
    components:
      portfolio.components ??
      [
        {
          id: 'quantum-live-demo',
          type: 'quantum-animation',
          title: 'Live Demo',
          description:
            'This is the actual quantum animation from my Quantum Echo project. It makes live calls through the same API surface documented above.',
        },
      ],
  };
}

function normalizePortfolio(portfolio: Portfolio, server: RegistryServer, origin: string | null): Portfolio {
  if ('api' in portfolio && (isQuantumServer(server) || QUANTUM_LEGACY_IDS.has(portfolio.api.id))) {
    return decorateQuantumPortfolio(portfolio, origin);
  }

  return portfolio;
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

async function getRegistry(origin: string | null): Promise<RegistryServer[]> {
  try {
    const response = await fetch(REGISTRY_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Registry fetch failed: ${response.status}`);
    const data: RegistryResponse = await response.json();
    return data.servers.map((server) => normalizeRegistryServer(server, origin));
  } catch {
    return FALLBACK_REGISTRY.map((server) => normalizeRegistryServer(server, origin));
  }
}

export async function GET(request: Request, { id }: { id: string }) {
  const routeId = normalizeRouteId(id);
  const origin = getRequestOrigin(request);

  try {
    const servers = await getRegistry(origin);
    const server = servers.find((candidate) => normalizeRouteId(candidate.id) === routeId);

    if (!server) {
      return Response.json(
        {
          success: false,
          error: `Server with ID "${id}" not found in registry`,
          availableIds: servers.flatMap((candidate) => [
            candidate.id,
            ...(candidate.aliases ?? []),
          ]),
        },
        { status: 404, headers: corsHeaders }
      );
    }

    const portfolioUrl = resolvePortfolioFetchUrl(server, origin);
    const portfolioResponse = await fetch(portfolioUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const finalResponse =
      portfolioResponse.status === 304
        ? await fetch(`${portfolioUrl}?_=${Date.now()}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          })
        : portfolioResponse;

    if (!finalResponse.ok) {
      throw new Error(`Portfolio fetch failed: ${finalResponse.status}`);
    }

    const portfolio: Portfolio = normalizePortfolio(await finalResponse.json(), server, origin);
    const registryEntry = normalizeRegistryServer(server, origin);

    return Response.json(
      {
        success: true,
        data: {
          portfolio,
          registryEntry,
        },
        fetchedAt: new Date().toISOString(),
        source: 'live',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[API /portfolio/${id}] Error:`, error);

    const fallbackPortfolio = FALLBACK_PORTFOLIOS[routeId];
    const fallbackServer = FALLBACK_REGISTRY.find(
      (candidate) => normalizeRouteId(candidate.id) === routeId
    );

    if (fallbackPortfolio && fallbackServer) {
      const registryEntry = normalizeRegistryServer(fallbackServer, origin);
      return Response.json(
        {
          success: true,
          data: {
            portfolio: normalizePortfolio(fallbackPortfolio, registryEntry, origin),
            registryEntry,
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
