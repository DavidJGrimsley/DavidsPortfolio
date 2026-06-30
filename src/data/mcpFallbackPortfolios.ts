import type { MCPPortfolio, RegistryServer } from '@/types/registry';

export const DEFAULT_MCP_ID = 'mrdj-app-mcp';

const SITE_ORIGIN = 'https://davidjgrimsley.com';

export function getMcpFallbackPortfolioUrl(id: string) {
  return `${SITE_ORIGIN}/public-facing/mcp/${id}/portfolio.json`;
}

function mcpPageUrl(id: string) {
  return `${SITE_ORIGIN}/public-facing/mcp/${id}`;
}

function mcpEndpointUrl(id: string) {
  return `${mcpPageUrl(id)}/mcp`;
}

export const MCP_FALLBACK_PORTFOLIOS: Record<string, MCPPortfolio> = {
  'mrdj-app-mcp': {
    mcp: {
      id: 'mrdj-app-mcp',
      name: 'mrdj-app-mcp',
      version: '0.1.0',
      description:
        'Model Context Protocol server exposing React Native, Expo Router, and full-stack development guides as structured resources.',
      repoUrl: 'https://github.com/DavidJGrimsley/mrdj-app-mcp',
      docsUrl: mcpPageUrl('mrdj-app-mcp'),
      status: 'active',
      featured: true,
      tags: ['MCP', 'React Native', 'Expo', 'guides'],
      transport: 'sse',
    },
    resources: [
      {
        uri: 'guides://architecture',
        name: 'architecture',
        title: 'Architecture',
        description: 'Stack, structure, and conventions for PokePages.',
      },
      {
        uri: 'guides://state-management',
        name: 'state-management',
        title: 'State Management',
        description: 'Zustand patterns, selectors, persistence, and performance tips.',
      },
      {
        uri: 'guides://database-architecture',
        name: 'database-architecture',
        title: 'Database Architecture',
        description: 'Drizzle and Supabase schema patterns, RLS, and migration practices.',
      },
      {
        uri: 'guides://routing',
        name: 'routing',
        title: 'Routing',
        description: 'Expo Router layouts, guards, deep linking, and SEO head usage.',
      },
      {
        uri: 'guides://styling',
        name: 'styling',
        title: 'Styling',
        description: 'NativeWind setup, class patterns, dark mode, and responsive rules.',
      },
      {
        uri: 'guides://performance',
        name: 'performance',
        title: 'Performance',
        description: 'React Native performance checklist for startup, rerenders, lists, and animation.',
      },
      {
        uri: 'guides://animation',
        name: 'animation',
        title: 'Animation',
        description: 'Reanimated setup, shared values, gestures, layout animations, and patterns.',
      },
      {
        uri: 'guides://meta-tags',
        name: 'meta-tags',
        title: 'Meta Tags',
        description: 'SEO and meta templates for Expo Router pages.',
      },
      {
        uri: 'guides://offline-first',
        name: 'offline-first',
        title: 'Offline First',
        description: 'Conflict resolution, sync strategy, storage, and NetInfo guidance.',
      },
      {
        uri: 'guides://plesk-deployment',
        name: 'plesk-deployment',
        title: 'Plesk Deployment',
        description: 'Plesk web/API deployment steps, env management, and rollback notes.',
      },
      {
        uri: 'guides://build-scripts',
        name: 'build-scripts',
        title: 'Build Scripts',
        description: 'Sitemap generation and API build workflows.',
      },
    ],
    tools: [
      {
        name: 'list-guides',
        title: 'List Copilot Guides',
        description: 'Return the available copilot guides as resource links.',
      },
    ],
    prompts: [
      {
        name: 'architecture-help',
        title: 'Architecture and DB helper',
        description:
          'Answer architecture or database design questions using the architecture and database guides.',
        arguments: [{ name: 'question', required: true }],
      },
      {
        name: 'state-store-template',
        title: 'Zustand store helper',
        description: 'Generate a Zustand store plan using the state management guide.',
        arguments: [
          { name: 'storeName', required: true },
          { name: 'concern' },
          { name: 'persistence' },
        ],
      },
      {
        name: 'routing-checklist',
        title: 'Routing checklist',
        description: 'Provide an Expo Router checklist for a screen or flow.',
        arguments: [{ name: 'route', required: true }],
      },
    ],
    endpoints: [
      {
        id: 'mcp-endpoint',
        title: 'MCP Endpoint',
        method: 'GET',
        url: mcpEndpointUrl('mrdj-app-mcp'),
        description: 'Primary MCP server endpoint using SSE transport.',
        transport: 'sse',
        contentType: 'text/event-stream',
      },
      {
        id: 'portfolio-meta',
        title: 'Portfolio Metadata',
        method: 'GET',
        url: getMcpFallbackPortfolioUrl('mrdj-app-mcp'),
        description: 'JSON metadata used by this screen for resources, tools, and prompts.',
        contentType: 'application/json',
      },
      {
        id: 'github-repo',
        title: 'GitHub Repository',
        method: 'GET',
        url: 'https://github.com/DavidJGrimsley/mrdj-app-mcp',
        description: 'Source code and documentation for the MCP server.',
      },
    ],
  },
  'mrdj-pokemon-mcp': {
    mcp: {
      id: 'mrdj-pokemon-mcp',
      name: 'mrdj-pokemon-mcp',
      version: '0.1.0',
      description:
        'MCP server exposing Pokemon strategy guides and PokeAPI-style tools: Pokemon lookup/search, type effectiveness, counter suggestions, and team coverage helpers.',
      repoUrl: 'https://github.com/DavidJGrimsley/mrdj-pokemon-mcp',
      docsUrl: mcpPageUrl('mrdj-pokemon-mcp'),
      status: 'active',
      featured: true,
      tags: ['MCP', 'Pokemon', 'PokeAPI', 'strategy'],
      transport: 'streamable-http',
    },
    resources: [
      {
        uri: 'guides://index',
        name: 'index',
        title: 'Index',
        description: 'Entry point for all strategy guides.',
      },
      {
        uri: 'guides://general',
        name: 'general',
        title: 'General',
        description: 'General Pokemon tips and best practices.',
      },
      {
        uri: 'guides://tera-raid',
        name: 'tera-raid',
        title: 'Tera Raids',
        description: 'Strategies for tough Tera Raid battles.',
      },
    ],
    tools: [
      {
        name: 'list-guides',
        title: 'List Strategy Guides',
        description: 'Return the available strategy guides as resource links.',
      },
      {
        name: 'get_strategy',
        title: 'Get Strategy Guide',
        description: 'Return the full Markdown for one of the built-in strategy guides.',
      },
      {
        name: 'get_pokemon',
        title: 'Get Pokemon',
        description:
          'Lookup Pokemon data by name or National Dex id from local PokeAPI api-data sync.',
      },
      {
        name: 'search_pokemon',
        title: 'Search Pokemon',
        description: 'Search Pokemon names using local PokeAPI api-data index.',
      },
      {
        name: 'type_effectiveness',
        title: 'Type Effectiveness',
        description: 'Calculate damage multiplier for an attacking type against 1-2 defending types.',
      },
      {
        name: 'counter_pokemon',
        title: 'Counter Pokemon',
        description: 'Suggest best attacking types and example Pokemon to counter a target Pokemon.',
      },
      {
        name: 'suggest_team',
        title: 'Suggest Team',
        description: 'Analyze a team and suggest defensive coverage improvements.',
      },
    ],
    prompts: [],
    endpoints: [
      {
        id: 'mcp-endpoint',
        title: 'MCP Endpoint',
        method: 'GET',
        url: mcpEndpointUrl('mrdj-pokemon-mcp'),
        description: 'Primary MCP endpoint with Streamable HTTP and legacy SSE fallback.',
        transport: 'streamable-http',
        contentType: 'application/json',
      },
      {
        id: 'portfolio-json',
        title: 'Portfolio Metadata',
        method: 'GET',
        url: getMcpFallbackPortfolioUrl('mrdj-pokemon-mcp'),
        description: 'JSON metadata used by this screen for resources, tools, and prompts.',
        contentType: 'application/json',
      },
      {
        id: 'health',
        title: 'Health Check',
        method: 'GET',
        url: `${mcpPageUrl('mrdj-pokemon-mcp')}/health`,
        description: 'Server health status endpoint.',
        contentType: 'application/json',
      },
      {
        id: 'github-repo',
        title: 'GitHub Repository',
        method: 'GET',
        url: 'https://github.com/DavidJGrimsley/mrdj-pokemon-mcp',
        description: 'Source code and documentation for the MCP server.',
      },
    ],
  },
};

export function getMcpFallbackPortfolio(id = DEFAULT_MCP_ID): MCPPortfolio {
  const portfolio = MCP_FALLBACK_PORTFOLIOS[id];
  if (portfolio) return portfolio;

  return {
    mcp: {
      id,
      name: id,
      version: '0.1.0',
      description:
        'Live MCP metadata is unavailable. This page will hydrate from the registry API when the server responds.',
      repoUrl: 'https://github.com/DavidJGrimsley',
      docsUrl: mcpPageUrl(id),
      status: 'offline',
      tags: ['MCP'],
      transport: 'sse',
    },
    resources: [],
    tools: [],
    prompts: [],
    endpoints: [
      {
        id: 'portfolio-json',
        title: 'Portfolio Metadata',
        method: 'GET',
        url: getMcpFallbackPortfolioUrl(id),
        description: 'JSON metadata for this MCP server.',
        contentType: 'application/json',
      },
    ],
  };
}

export function getMcpFallbackRegistryEntry(id = DEFAULT_MCP_ID): RegistryServer {
  return {
    id,
    type: 'mcp',
    portfolioUrl: getMcpFallbackPortfolioUrl(id),
  };
}
