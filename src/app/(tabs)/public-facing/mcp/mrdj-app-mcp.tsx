import React, { useState, useEffect } from 'react';
import { View, Pressable, Linking, Clipboard } from 'react-native';
import Head from 'expo-router/head';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { GreyView } from '@/components/UI/GreyView';
import {
  MCPResourceCard,
  MCPToolCard,
  MCPPromptCard,
  MCPFeatureCard,
  MCPCollapsibleSection,
  MCPCodeBlock,
} from '~/src/components/PublicFacing/mcp/MCPComponents';
import { MCPHeroSection, MCPWhatIsSection } from '~/src/components/PublicFacing/mcp/MCPPageSections';
import { PublicFacingDetailWrapper } from '~/src/components/PublicFacing/PublicFacingDetailWrapper';

// Server URLs
const MCP_BASE_URL = 'https://davidjgrimsley.com/public-facing/mcp/app/mrdj-app-mcp';
const MCP_ENDPOINT = 'https://davidjgrimsley.com/public-facing/mcp/mrdj-app-mcp/mcp';
const GITHUB_REPO = 'https://github.com/DavidJGrimsley/mrdj-app-mcp';
const MCP_PORTFOLIO_META_URL = 'https://davidjgrimsley.com/public-facing/mcp/mrdj-app-mcp/portfolio.json';

type MCPEndpointMeta = {
  id: string;
  title: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  url: string;
  description?: string;
  transport?: string;
  contentType?: string;
};

type MCPPortfolioMeta = {
  server: {
    id: string;
    name: string;
    version: string;
    mcpEndpointUrl: string;
    githubRepoUrl: string;
  };
  resources: { id: string; title: string; fileName: string; description: string }[];
  tools: { name: string; title: string; description: string; schema: any }[];
  prompts: { name: string; title: string; description: string; args: string[] }[];
  endpoints?: MCPEndpointMeta[];
};

export default function MCPAppPage() {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [portfolioMeta, setPortfolioMeta] = useState<MCPPortfolioMeta | null>(null);
  const [isMetaSynced, setIsMetaSynced] = useState(false);

  const handleCopyEndpoint = () => {
    Clipboard.setString(portfolioMeta?.server?.mcpEndpointUrl ?? MCP_ENDPOINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = (url: string) => {
    Clipboard.setString(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const seoTitle = 'Model Context Protocol (MCP) Server | mrdj-app-mcp | David Grimsley';
  const seoDescription =
    'MCP server exposing React Native, Expo Router, and full-stack development guides. Structured resources for AI tools, including architecture patterns, state management, database design, and deployment strategies. Open-source MCP implementation for developer knowledge sharing.';
  const seoKeywords =
    'MCP, Model Context Protocol, AI tools, developer resources, React Native, Expo Router, full-stack development, architecture patterns, state management, Drizzle ORM, Supabase, deployment guides, open-source, AI assistant, developer documentation, software engineering, David Grimsley';
  const seoImage = 'https://davidjgrimsley.com/images/mcp-app-preview.png';
  const seoUrl = 'https://davidjgrimsley.com/public-facing/mcp/app';

  // MCP Resources (guides) fallback (local)
  const fallbackMcpResources = [
    {
      id: 'architecture',
      title: 'Architecture',
      fileName: 'architecture.md',
      description: 'Stack, structure, and conventions for PokePages.',
    },
    {
      id: 'state-management',
      title: 'State Management',
      fileName: 'stateManagement.md',
      description: 'Zustand patterns, selectors, persistence, and performance tips.',
    },
    {
      id: 'database-architecture',
      title: 'Database Architecture',
      fileName: 'databaseArchitecture.md',
      description: 'Drizzle + Supabase schema patterns, RLS, and migration practices.',
    },
    {
      id: 'routing',
      title: 'Routing',
      fileName: 'routing.md',
      description: 'Expo Router layouts, guards, deep linking, and SEO head usage.',
    },
    {
      id: 'styling',
      title: 'Styling',
      fileName: 'styling.md',
      description: 'NativeWind setup, class patterns, dark mode, and responsive rules.',
    },
    {
      id: 'performance',
      title: 'Performance',
      fileName: 'performance.md',
      description: 'React Native perf checklist: startup, rerenders, lists, and animation.',
    },
    {
      id: 'animation',
      title: 'Animation',
      fileName: 'animation.md',
      description: 'Reanimated setup, shared values, gestures, layout animations, and patterns.',
    },
    {
      id: 'meta-tags',
      title: 'Meta Tags',
      fileName: 'metaTags.md',
      description: 'SEO/meta templates for Expo Router (OG/Twitter/structured data).',
    },
    {
      id: 'offline-first',
      title: 'Offline First',
      fileName: 'offlineFirst.md',
      description: 'Conflict resolution, sync strategy, storage, and NetInfo guidance.',
    },
    {
      id: 'plesk-deployment',
      title: 'Plesk Deployment',
      fileName: 'pleskDeployment.md',
      description: 'Plesk web/API deployment steps, env management, and rollback notes.',
    },
    {
      id: 'build-scripts',
      title: 'Build Scripts',
      fileName: 'buildScripts.md',
      description: 'Sitemap generator and API build workflows.',
    },
  ];

  // MCP Tools fallback (local)
  const fallbackMcpTools = [
    {
      name: 'list-guides',
      title: 'List Copilot Guides',
      description: 'Return the available copilot guides as resource links',
      schema: {},
    },
  ];

  // MCP Prompts fallback (local)
  const fallbackMcpPrompts = [
    {
      name: 'architecture-help',
      title: 'Architecture and DB helper',
      description: 'Answer architecture or database design questions using the architecture and database guides',
      args: ['question'],
    },
    {
      name: 'state-store-template',
      title: 'Zustand store helper',
      description: 'Generate a Zustand store plan using the state management guide',
      args: ['storeName', 'concern', 'persistence'],
    },
    {
      name: 'routing-checklist',
      title: 'Routing checklist',
      description: 'Provide an Expo Router checklist for a screen or flow',
      args: ['route'],
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolioMeta = async () => {
      try {
        const response = await fetch(MCP_PORTFOLIO_META_URL, {
          method: 'GET',
          cache: 'no-store' as any,
        });

        // Some servers/CDNs return 304 for conditional requests; fetch() then has no body.
        // Recover by doing a one-time cache-busted request.
        const finalResponse =
          response.status === 304
            ? await fetch(`${MCP_PORTFOLIO_META_URL}?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store' as any,
              })
            : response;

        if (!finalResponse.ok) throw new Error(`HTTP ${finalResponse.status}`);
        const data = (await finalResponse.json()) as MCPPortfolioMeta;
        if (!isMounted) return;
        setPortfolioMeta(data);
        setIsMetaSynced(true);
      } catch {
        if (!isMounted) return;
        setPortfolioMeta(null);
        setIsMetaSynced(false);
      }
    };

    fetchPortfolioMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  const mcpEndpointUrl = portfolioMeta?.server?.mcpEndpointUrl ?? MCP_ENDPOINT;
  const githubRepoUrl = portfolioMeta?.server?.githubRepoUrl ?? GITHUB_REPO;
  const serverVersion = portfolioMeta?.server?.version ?? '0.1.0';

  const mcpResources = portfolioMeta?.resources ?? fallbackMcpResources;
  const mcpTools = portfolioMeta?.tools ?? fallbackMcpTools;
  const mcpPrompts = portfolioMeta?.prompts ?? fallbackMcpPrompts;

  const fallbackMcpEndpoints: MCPEndpointMeta[] = [
    {
      id: 'mcp-endpoint',
      title: 'MCP Endpoint',
      method: 'GET',
      url: mcpEndpointUrl,
      description: 'Primary MCP server endpoint (SSE transport).',
      transport: 'sse',
      contentType: 'text/event-stream',
    },
    {
      id: 'portfolio-meta',
      title: 'Portfolio Metadata',
      method: 'GET',
      url: MCP_PORTFOLIO_META_URL,
      description: 'JSON metadata used by this screen for resources/tools/prompts.',
      contentType: 'application/json',
    },
    {
      id: 'github-repo',
      title: 'GitHub Repository',
      method: 'GET',
      url: githubRepoUrl,
      description: 'Source code and documentation for the MCP server.',
    },
  ];

  const mcpEndpoints =
    Array.isArray(portfolioMeta?.endpoints) && portfolioMeta!.endpoints.length > 0
      ? portfolioMeta!.endpoints
      : fallbackMcpEndpoints;

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
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "mrdj-app-mcp",
            "description": seoDescription,
            "author": {
              "@type": "Person",
              "name": "David Grimsley",
              "url": "https://davidjgrimsley.com"
            },
            "codeRepository": GITHUB_REPO,
            "programmingLanguage": "TypeScript",
            "runtimePlatform": "Node.js",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })}
        </script>
      </Head>
      
      <PublicFacingDetailWrapper>
        <MCPHeroSection
          title="mrdj-app-mcp"
          version={serverVersion}
          description={
            'Model Context Protocol (MCP) server that surfaces React Native, Expo Router, and full-stack development\n' +
            'guides as structured resources. Now live and publicly accessible! AI tools can query the\n' +
            'same documentation I use for building production applications, either locally or via the hosted endpoint.'
          }
          keyFeatures={[
            '11 comprehensive development guides (architecture, routing, state, DB, styling, performance)',
            'MCP resources for AI-powered code assistance',
            'Interactive prompts for architecture, stores, and routing',
            'Plesk-friendly deployment (also Docker, VPS, serverless)',
          ]}
          mcpEndpointUrl={mcpEndpointUrl}
          githubRepoUrl={githubRepoUrl}
          copiedEndpoint={copied}
          onCopyEndpoint={handleCopyEndpoint}
          tintColor={tintColor}
          accentColor={accentColor}
          textColor={textColor}
          iconName="git-network"
          endpointLabel="🌐 Live MCP Endpoint (SSE):"
        />

        <MCPWhatIsSection tintColor={tintColor} />

        {/* Endpoints Section */}
        <MCPCollapsibleSection title="Endpoints" icon="link">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              These are the public endpoints associated with this MCP server. This section is synced from
              <ThemedText className="font-mono"> portfolio.json</ThemedText> when available, with a local
              fallback.
            </ThemedText>
          </GreyView>

          {mcpEndpoints.map((endpoint) => (
            <View
              key={endpoint.id || endpoint.url}
              className="rounded-2.5 p-4 mb-3 border-l-4"
              style={{ backgroundColor: accentColor, borderLeftColor: tintColor }}
            >
              <View className="flex-row items-center mb-2">
                <View
                  className="px-2.5 py-1.5 rounded-lg mr-3"
                  style={{ backgroundColor: tintColor }}
                >
                  <ThemedText className="badge-text text-white">
                    {String(endpoint.method ?? 'GET').toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText className="detail-subheader flex-1" style={{ color: textColor }}>
                  {endpoint.title}
                </ThemedText>
              </View>

              {endpoint.description ? (
                <ThemedText className="detail-body opacity-75 mb-2.5" style={{ color: textColor }}>
                  {endpoint.description}
                </ThemedText>
              ) : null}

              <View className="flex-row items-center gap-2">
                <ExternalLink href={endpoint.url}>
                  <ThemedText
                    className="detail-body font-mono font-semibold"
                    style={{ color: tintColor }}
                  >
                    {endpoint.url}
                  </ThemedText>
                </ExternalLink>

                <Pressable
                  onPress={() => handleCopyUrl(endpoint.url)}
                  style={({ pressed }) => ({
                    backgroundColor: copiedUrl === endpoint.url ? tintColor : tintColor + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={copiedUrl === endpoint.url ? 'checkmark' : 'copy-outline'}
                    size={20}
                    color={copiedUrl === endpoint.url ? '#fff' : tintColor}
                  />
                </Pressable>
              </View>

              {(endpoint.transport || endpoint.contentType) && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {endpoint.transport ? (
                    <View
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: tintColor + '20' }}
                    >
                      <ThemedText className="detail-meta opacity-85" style={{ color: textColor }}>
                        Transport: <ThemedText className="font-semibold">{endpoint.transport}</ThemedText>
                      </ThemedText>
                    </View>
                  ) : null}

                  {endpoint.contentType ? (
                    <View
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: tintColor + '20' }}
                    >
                      <ThemedText className="detail-meta opacity-85" style={{ color: textColor }}>
                        Content-Type: <ThemedText className="font-semibold">{endpoint.contentType}</ThemedText>
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ))}
        </MCPCollapsibleSection>

        {/* Available Resources Section */}
        <MCPCollapsibleSection title="Available Resources" icon="library">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              The following guides are exposed as MCP resources. AI tools can read and reference these documents when
              assisting with development tasks.
            </ThemedText>
          </GreyView>

          {mcpResources.map((resource) => (
            <MCPResourceCard key={resource.id} {...resource} />
          ))}

          <View
            className="rounded-2.5 p-4 mt-2"
            style={{ backgroundColor: tintColor + '20' }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color={tintColor} className="mr-2" />
              <ThemedText className="detail-subheader">
                Resource Access
              </ThemedText>
            </View>
            <ThemedText className="detail-meta opacity-80">
              AI assistants can read any of these resources by their ID (e.g., "architecture", "routing"). Each
              resource returns markdown documentation with code examples, best practices, and architectural patterns.
            </ThemedText>
          </View>
        </MCPCollapsibleSection>

        {/* Tools Section */}
        <MCPCollapsibleSection title="Tools" icon="construct">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              Tools are functions that AI assistants can invoke to perform specific operations.
            </ThemedText>
          </GreyView>

          {mcpTools.map((tool) => (
            <MCPToolCard key={tool.name} {...tool} />
          ))}
        </MCPCollapsibleSection>

        {/* Prompts Section */}
        <MCPCollapsibleSection title="Prompts" icon="chatbubbles">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              Prompts are pre-configured message templates that guide AI assistants in using the resources effectively.
            </ThemedText>
          </GreyView>

          {mcpPrompts.map((prompt) => (
            <MCPPromptCard key={prompt.name} {...prompt} />
          ))}
        </MCPCollapsibleSection>

        {/* How to Use Section */}
        <MCPCollapsibleSection title="How to Use" icon="book">
          <View className="bg-secondary/15 rounded-2.5 p-4 mb-5 border-l-4 border-l-tint">
            <View className="flex-row items-center mb-2">
              <Ionicons name="rocket" size={20} color={tintColor} className="mr-2" />
              <ThemedText className="detail-subheader">
                Quick Start: Use the Public Endpoint
              </ThemedText>
            </View>
            <ThemedText className="detail-body">
              No installation needed! Connect your AI client directly to the live endpoint:
            </ThemedText>
            <ThemedText
              className="detail-meta font-mono font-semibold mt-2"
              style={{ color: tintColor }}
            >
              {mcpEndpointUrl}
            </ThemedText>
          </View>

          <GreyView className="mb-3">
            <ThemedText
              className="detail-subheader mb-3"
            >
              Option 1: Use the Live Public Endpoint (Recommended but has limitations for scanning entire codebase - stdio mode recommended for full access)
            </ThemedText>

            <ThemedText className="detail-body mb-3 opacity-80">
              Connect to the hosted MCP server running on my VPS. Works with VS Code, Claude Desktop, and any MCP-compatible client.
            </ThemedText>

            <ThemedText className="detail-body opacity-80">
              For VS Code with Cline or other MCP extensions:
            </ThemedText>
          </GreyView>

          <MCPCodeBlock
            language="json"
            code={`// In your MCP client settings:
{
  "mcpServers": {
    "mrdj-app-mcp": {
      "url": "${mcpEndpointUrl}",
      "transport": "sse"
    }
  }
}`}
          />

          <GreyView className="mb-3">
            <ThemedText className="detail-body mb-3 opacity-80">
              For Claude Desktop:
            </ThemedText>
          </GreyView>

          <MCPCodeBlock
            language="json"
            code={`// Add to claude_desktop_config.json:
{
  "mcpServers": {
    "mrdj-app-mcp": {
      "url": "${mcpEndpointUrl}"
    }
  }
}`}
          />

          <View className="bg-tint/15 rounded-2.5 p-4 mt-3 mb-5 border-l-4 border-l-tint">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color={tintColor} className="mr-2" />
              <ThemedText className="detail-subheader">
                More Information
              </ThemedText>
            </View>
            <ThemedText className="detail-meta">
              Visit{' '}
              <ExternalLink href={MCP_BASE_URL}>
                <ThemedText className="font-semibold" style={{ color: tintColor }}>
                  davidjgrimsley.com/public-facing/mcp/mrdj-app-mcp
                </ThemedText>
              </ExternalLink>
              {' '}for detailed setup instructions and troubleshooting.
            </ThemedText>
          </View>

          <GreyView className="mb-3">
            <ThemedText
              className="detail-subheader mb-3"
            >
              Option 2: Run Locally (stdio mode)
            </ThemedText>
          </GreyView>

          <MCPCodeBlock
            language="bash"
            code={`# Clone the repository
git clone ${githubRepoUrl}.git
cd mrdj-app-mcp

# Install dependencies
npm install

# Build the server
npm run build

# Start the MCP server
npm start`}
          />

          <GreyView className="mt-4 mb-3">
            <ThemedText
              className="detail-subheader mb-3"
            >
              2. Configure Your AI Tool
            </ThemedText>

            <ThemedText className="detail-body opacity-80">
              For Claude Desktop, add to your <ThemedText className="font-mono">claude_desktop_config.json</ThemedText>:
            </ThemedText>
          </GreyView>

          <MCPCodeBlock
            language="json"
            code={`{
  "mcpServers": {
    "mrdj-app-mcp": {
      "command": "node",
      "args": ["/path/to/mrdj-app-mcp/build/index.js"]
    }
  }
}`}
          />

          <GreyView className="mt-4 mb-4">
            <ThemedText
              className="detail-subheader mb-3"
            >
              3. Use in AI Conversations
            </ThemedText>

            <ThemedText className="detail-body mb-2 opacity-80">
              Once configured, your AI assistant can:
            </ThemedText>

            <View className="pl-2">
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Read architecture guides when discussing app structure
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Generate Zustand stores following your patterns
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Create routing checklists for new screens
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Answer database design questions with your conventions
              </ThemedText>
            </View>
          </GreyView>

          <View className="bg-accent/15 rounded-2.5 p-4 border-l-4 border-l-tint">
            <View className="flex-row items-center mb-2">
              <Ionicons name="bulb" size={20} color={tintColor} className="mr-2" />
              <ThemedText className="detail-subheader">
                Pro Tip
              </ThemedText>
            </View>
            <ThemedText className="detail-meta">
              You don't need to explicitly mention the MCP server in your prompts. Once configured, the AI will
              automatically use the resources when relevant to your questions.
            </ThemedText>
          </View>
        </MCPCollapsibleSection>

        {/* Hosting Options Section */}
        <MCPCollapsibleSection title="Hosting & Deployment" icon="cloud-upload">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              This MCP server can be deployed in multiple ways:
            </ThemedText>
          </GreyView>

          <MCPFeatureCard
            icon="desktop"
            title="Local stdio (Recommended)"
            description="Run on your machine via Claude Desktop or other MCP clients"
          />

          <MCPFeatureCard
            icon="server"
            title="VPS with Nginx"
            description="Deploy on a VPS behind Nginx reverse proxy (Plesk-friendly)"
          />

          <MCPFeatureCard
            icon="logo-docker"
            title="Docker Container"
            description="Containerize for easy deployment to any platform"
          />

          <MCPFeatureCard
            icon="cloud"
            title="Serverless HTTP"
            description="Add HTTP transport wrapper for serverless deployment"
          />

          <GreyView className="mt-4 mb-3">
            <ThemedText
              className="detail-subheader"
            >
              This Server's Deployment
            </ThemedText>
          </GreyView>

          <View
            className="rounded-2.5 p-4 mb-3 border-l-4 border-l-[#10b981]"
            style={{ backgroundColor: accentColor }}
          >
            <View className="flex-row items-center mb-3">
              <View className="bg-[#10b981] px-2.5 py-1.5 rounded-xl">
                <ThemedText className="badge-text text-white">
                  🟢 LIVE IN PRODUCTION
                </ThemedText>
              </View>
            </View>
            <ThemedText className="detail-body opacity-80 mb-2">
              <ThemedText className="font-semibold">Environment:</ThemedText> VPS (Plesk) with Nginx reverse proxy
            </ThemedText>
            <ThemedText className="detail-body opacity-80 mb-2">
              <ThemedText className="font-semibold">Endpoint:</ThemedText> {mcpEndpointUrl}
            </ThemedText>
            <ThemedText className="detail-body opacity-80 mb-2">
              <ThemedText className="font-semibold">Transport:</ThemedText> Server-Sent Events (SSE)
            </ThemedText>
            <ThemedText className="detail-body opacity-80 mb-2">
              <ThemedText className="font-semibold">Accessibility:</ThemedText> Public - Anyone can connect
            </ThemedText>
            <ThemedText className="detail-body opacity-80">
              <ThemedText className="font-semibold">Info Page:</ThemedText>{' '}
              <ExternalLink href={MCP_BASE_URL}>
                <ThemedText className="font-semibold" style={{ color: tintColor }}>
                  davidjgrimsley.com/public-facing/mcp/mrdj-app-mcp
                </ThemedText>
              </ExternalLink>
            </ThemedText>
          </View>
        </MCPCollapsibleSection>

        {/* Use Cases Section */}
        <MCPCollapsibleSection title="Use Cases" icon="apps">
          <View
            className="rounded-2.5 p-4 mb-3"
            style={{ backgroundColor: accentColor }}
          >
            <ThemedText className="detail-subheader mb-2">
              🎓 Learning & Education
            </ThemedText>
            <ThemedText className="detail-body opacity-80">
              Students and developers can explore modern React Native patterns, Expo Router conventions, and
              full-stack architecture through AI-assisted learning.
            </ThemedText>
          </View>

          <View
            className="rounded-2.5 p-4 mb-3"
            style={{ backgroundColor: accentColor }}
          >
            <ThemedText className="detail-subheader mb-2">
              🚀 Rapid Development
            </ThemedText>
            <ThemedText className="detail-body opacity-80">
              Generate boilerplate code, scaffolding, and configuration files that follow established patterns,
              reducing setup time for new features.
            </ThemedText>
          </View>

          <View
            className="rounded-2.5 p-4 mb-3"
            style={{ backgroundColor: accentColor }}
          >
            <ThemedText className="detail-subheader mb-2">
              👔 Portfolio & Hiring
            </ThemedText>
            <ThemedText className="detail-body opacity-80">
              Employers can see documented proof of architectural thinking, best practices knowledge, and commitment
              to maintainable, scalable code.
            </ThemedText>
          </View>

          <View
            className="rounded-2.5 p-4 mb-3"
            style={{ backgroundColor: accentColor }}
          >
            <ThemedText className="detail-subheader mb-2">
              🔧 Team Standardization
            </ThemedText>
            <ThemedText className="detail-body opacity-80">
              Teams can fork and customize this MCP server to encode their own conventions, ensuring consistency
              across projects and team members.
            </ThemedText>
          </View>
        </MCPCollapsibleSection>

        {/* Tech Stack Section */}
        <MCPCollapsibleSection title="Tech Stack" icon="code-slash">
          <GreyView className="mb-4">
            <ThemedText className="detail-subheader mb-2">
              Runtime & Build
            </ThemedText>
            <View className="pl-2">
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Node.js 18+ (ES modules)
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • TypeScript with tsc compiler
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Single entrypoint: build/index.js
              </ThemedText>
            </View>
          </GreyView>

          <GreyView className="mb-4">
            <ThemedText className="detail-subheader mb-2">
              MCP SDK
            </ThemedText>
            <View className="pl-2">
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • @modelcontextprotocol/sdk 1.25.x
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Zod for schema validation
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Stdio transport (local development)
              </ThemedText>
            </View>
          </GreyView>

          <GreyView>
            <ThemedText className="detail-subheader mb-2">
              Content
            </ThemedText>
            <View className="pl-2">
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • File-based markdown guides
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • 11 comprehensive development guides
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • Covers: React Native, Expo Router, Zustand, Drizzle, Supabase, deployment
              </ThemedText>
            </View>
          </GreyView>
        </MCPCollapsibleSection>

        {/* Resources & Links Section */}
        <View className="mt-5">
          <ThemedText
            className="detail-section-header mb-4"
          >
            Resources & Links
          </ThemedText>

          <Pressable
            onPress={() => Linking.openURL(githubRepoUrl)}
            className="rounded-2.5 p-4 mb-3 flex-row items-center"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons name="logo-github" size={24} color={textColor} className="mr-3" />
            <View className="flex-1">
              <ThemedText className="detail-subheader">
                GitHub Repository
              </ThemedText>
              <ThemedText className="detail-meta opacity-70">
                Source code, guides, and documentation
              </ThemedText>
            </View>
            <Ionicons name="open-outline" size={20} color={textColor} className="opacity-50" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('https://modelcontextprotocol.io')}
            className="rounded-2.5 p-4 mb-3 flex-row items-center"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons name="document-text" size={24} color={textColor} className="mr-3" />
            <View className="flex-1">
              <ThemedText className="detail-subheader">
                MCP Documentation
              </ThemedText>
              <ThemedText className="detail-meta opacity-70">
                Official Model Context Protocol docs
              </ThemedText>
            </View>
            <Ionicons name="open-outline" size={20} color={textColor} className="opacity-50" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('https://davidjgrimsley.com')}
            className="rounded-2.5 p-4 flex-row items-center"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons name="person-circle" size={24} color={textColor} className="mr-3" />
            <View className="flex-1">
              <ThemedText className="detail-subheader">
                David Grimsley
              </ThemedText>
              <ThemedText className="detail-meta opacity-70">
                Portfolio and other projects
              </ThemedText>
            </View>
            <Ionicons name="open-outline" size={20} color={textColor} className="opacity-50" />
          </Pressable>
        </View>

        {/* Portfolio Data Sync Note */}
        <View
          className="mt-6 rounded-2.5 p-3.5 flex-row items-center gap-2.5"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons
            name={isMetaSynced ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={18}
            color={isMetaSynced ? tintColor : textColor}
            className="opacity-90"
          />
          <ThemedText className="detail-meta opacity-75 flex-1">
            {isMetaSynced
              ? `Synced from ${MCP_PORTFOLIO_META_URL}`
              : 'Using local portfolio metadata (offline / fetch failed)'}
          </ThemedText>
        </View>
      </PublicFacingDetailWrapper>
    </>
  );
}


