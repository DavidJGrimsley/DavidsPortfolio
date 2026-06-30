/**
 * Types for the external API/MCP registry and portfolio data
 * Registry URL: https://davidjgrimsley.com/secret/registry.json
 */

// Registry entry types
export interface RegistryServer {
  id: string;
  type: 'api' | 'mcp';
  portfolioUrl: string;
  aliases?: string[];
  publicBasePath?: string;
}

export interface RegistryResponse {
  version: string;
  updatedAt: string;
  servers: RegistryServer[];
}

// Shared portfolio types for both API and MCP
export interface PortfolioEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  path: string;
  operationPath?: string;
  liveTestPath?: string;
  liveTestDisabledReason?: string;
  summary: string;
  description?: string;
  auth?: 'public' | 'api_key' | 'bearer_jwt';
  parameters?: PortfolioParameter[];
  requestBody?: {
    description: string;
    example: unknown;
  };
  responses?: PortfolioResponse[];
}

export interface PortfolioParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: unknown;
  enum?: string[];
  dependsOn?: string;
}

export interface PortfolioResponse {
  code: string;
  description: string;
  example?: unknown;
}

export interface APIAuthMetadata {
  apiKey?: boolean;
  bearerJwt?: boolean;
  showApiKeyDashboard?: boolean;
  supportsIbmProfiles?: boolean;
  provider?: 'supabase' | string;
  dashboardTitle?: string;
  dashboardDescription?: string;
}

export interface PortfolioContentLink {
  label: string;
  href: string;
}

export interface PortfolioContentSection {
  id: string;
  title: string;
  body?: string | string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  code?: {
    language?: string;
    value: string;
  };
  links?: PortfolioContentLink[];
}

export interface PortfolioComponentSlot {
  type: 'quantum-animation' | string;
  id?: string;
  title?: string;
  description?: string;
}

// API Portfolio structure
export interface APIPortfolio {
  api: {
    id: string;
    name: string;
    version: string;
    icon?: string;
    description?: string;
    baseUrl: string;
    docsUrl: string;
    healthUrl?: string;
    publicBasePath?: string;
    status: string;
    featured?: boolean;
    tags?: string[];
    uptime?: string;
    iconName?: string;
    features?: string[];
    auth?: APIAuthMetadata;
    liveTestExecutor?: 'fetch' | 'quantum-sdk';
  };
  endpoints: PortfolioEndpoint[];
  sections?: PortfolioContentSection[];
  components?: PortfolioComponentSlot[];
}

// MCP Portfolio structure
export interface MCPTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  title?: string;
  description?: string;
  arguments?: {
    name: string;
    description?: string;
    required?: boolean;
  }[];
}

export interface MCPEndpointMeta {
  id: string;
  title: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  url: string;
  description?: string;
  transport?: string;
  contentType?: string;
}

export interface MCPPortfolio {
  mcp: {
    id: string;
    name: string;
    version: string;
    icon?: string;
    description?: string;
    repoUrl?: string;
    docsUrl?: string;
    status: string;
    featured?: boolean;
    tags?: string[];
    transport?: string;
  };
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  endpoints?: MCPEndpointMeta[];
}

// Unified portfolio type for dynamic pages
export type Portfolio = APIPortfolio | MCPPortfolio;

// Type guards
export function isAPIPortfolio(portfolio: Portfolio): portfolio is APIPortfolio {
  return 'api' in portfolio && 'endpoints' in portfolio;
}

export function isMCPPortfolio(portfolio: Portfolio): portfolio is MCPPortfolio {
  return 'mcp' in portfolio;
}

// Loader data types
export interface PortfolioLoaderData {
  portfolio: Portfolio;
  registryEntry: RegistryServer;
  loadedAt: string;
  method: 'data-loader' | 'fallback';
}

export interface RegistryLoaderData {
  registry: RegistryResponse;
  loadedAt: string;
  method: 'data-loader' | 'fallback';
}
