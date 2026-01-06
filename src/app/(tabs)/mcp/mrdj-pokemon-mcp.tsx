import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Clipboard } from 'react-native';
import Head from 'expo-router/head';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MobileDetailsBackgroundGradient } from '@/components/Gradients';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { GreyView } from '@/components/UI/GreyView';
import {
  MCPCollapsibleSection,
  MCPResourceCard,
  MCPToolCard,
  MCPPromptCard,
} from '@/components/SoftwareDev/mcp/MCPComponents';
import { MCPHeroSection, MCPWhatIsSection } from '@/components/SoftwareDev/mcp/MCPPageSections';

const MCP_ENDPOINT = 'https://davidjgrimsley.com/mcp/mrdj-pokemon-mcp/mcp';
const GITHUB_REPO = 'https://github.com/DavidJGrimsley/mrdj-pokemon-mcp';
const MCP_PORTFOLIO_META_URL = 'https://davidjgrimsley.com/mcp/mrdj-pokemon-mcp/portfolio.json';

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
  resources: Array<{ id: string; title: string; fileName: string; description: string }>;
  tools: Array<{ name: string; title: string; description: string; schema: any }>;
  prompts: Array<{ name: string; title: string; description: string; args?: string[] }>;
  endpoints?: MCPEndpointMeta[];
};

export default function MRDJPokemonMcpPage() {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [portfolioMeta, setPortfolioMeta] = useState<MCPPortfolioMeta | null>(null);

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

  const seoTitle = 'Model Context Protocol (MCP) Server | mrdj-pokemon-mcp | David Grimsley';
  const seoDescription =
    'MCP server exposing Pokémon strategy guides and PokéAPI-style tools: Pokémon lookup/search, type effectiveness, counter suggestions, and team coverage helpers.';
  const seoKeywords =
    'MCP, Model Context Protocol, Pokemon, Pokémon, PokeAPI, type effectiveness, team builder, raid strategy, AI tools, developer resources, open-source, David Grimsley, mrdj-pokemon-mcp';
  const seoImage = 'https://davidjgrimsley.com/images/mcp-servers-preview.png';
  const seoUrl = 'https://davidjgrimsley.com/mcp/mrdj-pokemon-mcp';

  const fallbackMcpResources = useMemo(
    () => [
      {
        id: 'index',
        title: 'Index',
        fileName: 'index.md',
        description: 'Entry point for all strategy guides.',
      },
      {
        id: 'general',
        title: 'General',
        fileName: 'general.md',
        description: 'General Pokemon tips and best practices.',
      },
      {
        id: 'tera-raid',
        title: 'Tera Raids',
        fileName: 'tera-raid.md',
        description: 'Strategies for tough Tera Raid battles.',
      },
    ],
    []
  );

  const fallbackMcpTools = useMemo(
    () => [
      {
        name: 'list-guides',
        title: 'List Strategy Guides',
        description: 'Return the available strategy guides as resource links',
        schema: {},
      },
      {
        name: 'get_strategy',
        title: 'Get Strategy Guide',
        description: 'Return the full Markdown for one of the built-in strategy guides',
        schema: { guideId: 'string' },
      },
      {
        name: 'get_pokemon',
        title: 'Get Pokemon',
        description:
          'Lookup Pokemon data by name or National Dex id from local PokeAPI api-data sync (falls back to live PokeAPI when missing, cached locally)',
        schema: { nameOrId: 'string' },
      },
      {
        name: 'search_pokemon',
        title: 'Search Pokemon',
        description: 'Search Pokemon names using local PokeAPI api-data index',
        schema: { query: 'string', limit: 'number (optional)' },
      },
      {
        name: 'type_effectiveness',
        title: 'Type Effectiveness',
        description: 'Calculate damage multiplier for an attacking type against 1-2 defending types',
        schema: { attackingType: 'string', defendingTypes: 'string[] (1-2 items)' },
      },
      {
        name: 'counter_pokemon',
        title: 'Counter Pokemon',
        description:
          'Suggest best attacking types (and example Pokemon when local data exists) to counter a target Pokemon',
        schema: {
          targetNameOrId: 'string',
          topTypes: 'number (optional)',
          samplePokemonPerType: 'number (optional)',
        },
      },
      {
        name: 'suggest_team',
        title: 'Suggest Team',
        description: 'Analyze a team (by Pokemon names/ids) and suggest defensive coverage improvements',
        schema: {
          team: 'string[] (1-6 items)',
          topWeaknesses: 'number (optional)',
          suggestedDefensiveTypes: 'number (optional)',
        },
      },
    ],
    []
  );

  const fallbackMcpPrompts = useMemo(() => [], []);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolioMeta = async () => {
      try {
        const response = await fetch(MCP_PORTFOLIO_META_URL, {
          method: 'GET',
          cache: 'no-store' as any,
        });

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
      } catch {
        if (!isMounted) return;
        setPortfolioMeta(null);
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
      description: 'Primary MCP endpoint (Streamable HTTP + legacy SSE fallback).',
      transport: 'streamable-http',
      contentType: 'application/json',
    },
    {
      id: 'portfolio-json',
      title: 'Portfolio Metadata (portfolio.json)',
      method: 'GET',
      url: MCP_PORTFOLIO_META_URL,
      description: 'Metadata used by this screen for resources/tools/prompts.',
      contentType: 'application/json',
    },
    {
      id: 'health',
      title: 'Health Check',
      method: 'GET',
      url: 'https://davidjgrimsley.com/mcp/mrdj-pokemon-mcp/health',
      description: 'Server health status endpoint.',
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

        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={seoImage} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={seoUrl} />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={seoDescription} />
        <meta property="twitter:image" content={seoImage} />

        <link rel="canonical" href={seoUrl} />
        <meta name="author" content="David Grimsley" />
        <meta name="robots" content="index, follow" />
      </Head>

      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-grow"
      >
        <View className="flex-1">
          <MobileDetailsBackgroundGradient />
          <View
            className="flex-1 w-full max-w-[1200px] self-center bg-transparent px-5 py-[30px] pb-[60px]"
          >
            <MCPHeroSection
              title="mrdj-pokemon-mcp"
              version={serverVersion}
              description={
                'MCP server exposing Pokémon strategy guides and PokéAPI-style tools: Pokémon lookup/search, type\n' +
                'effectiveness, counter suggestions, and team coverage helpers. Now live and publicly accessible.'
              }
              keyFeatures={[
                'Built-in Pokémon strategy guides as MCP resources',
                'Pokémon lookup/search from a local PokeAPI data sync',
                'Type effectiveness calculator (1–2 defending types)',
                'Counters + team defensive coverage suggestions',
              ]}
              mcpEndpointUrl={mcpEndpointUrl}
              githubRepoUrl={githubRepoUrl}
              copiedEndpoint={copied}
              onCopyEndpoint={handleCopyEndpoint}
              tintColor={tintColor}
              accentColor={accentColor}
              textColor={textColor}
              iconName="paw"
              endpointLabel="🌐 Live MCP Endpoint (Streamable HTTP):"
            />

            <MCPWhatIsSection tintColor={tintColor} />

            <MCPCollapsibleSection title="Endpoints" icon="link">
            {mcpEndpoints.map((endpoint) => (
              <View
                key={endpoint.id || endpoint.url}
                className="rounded-[10px] p-4 mb-3 border-l-[3px]"
                style={{ backgroundColor: accentColor, borderLeftColor: tintColor }}
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="px-2.5 py-1.5 rounded-lg mr-3"
                    style={{ backgroundColor: tintColor }}
                  >
                    <ThemedText className="text-[1.2%] text-white font-bold">
                      {String(endpoint.method ?? 'GET').toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText className="text-[2%] font-semibold flex-1" style={{ color: textColor }}>
                    {endpoint.title}
                  </ThemedText>
                </View>

                {endpoint.description ? (
                  <ThemedText className="text-[1.7%] opacity-75 mb-2.5" style={{ color: textColor }}>
                    {endpoint.description}
                  </ThemedText>
                ) : null}

                <View className="flex-row items-center gap-2">
                  <ExternalLink href={endpoint.url}>
                    <ThemedText
                      className="text-[1.7%] font-mono font-semibold"
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
                    accessibilityLabel={`Copy ${endpoint.title} URL`}
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
                        <ThemedText className="text-[1.4%] opacity-85" style={{ color: textColor }}>
                          Transport: <ThemedText className="font-semibold">{endpoint.transport}</ThemedText>
                        </ThemedText>
                      </View>
                    ) : null}

                    {endpoint.contentType ? (
                      <View
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: tintColor + '20' }}
                      >
                        <ThemedText className="text-[1.4%] opacity-85" style={{ color: textColor }}>
                          Content-Type: <ThemedText className="font-semibold">{endpoint.contentType}</ThemedText>
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
          </MCPCollapsibleSection>

          <MCPCollapsibleSection title="Available Resources" icon="library">
            <GreyView className="mb-4">
              <ThemedText className="text-[1.9%] opacity-80">
                These guides are exposed as MCP resources. AI tools can read and reference them when answering Pokémon
                questions.
              </ThemedText>
            </GreyView>

            {mcpResources.map((resource) => (
              <MCPResourceCard key={resource.id} {...resource} />
            ))}
          </MCPCollapsibleSection>

          <MCPCollapsibleSection title="Tools" icon="construct">
            <GreyView className="mb-4">
              <ThemedText className="text-[1.9%] opacity-80">
                Tools are functions an AI assistant can invoke (lookup, search, matchup math, counters, team suggestions).
              </ThemedText>
            </GreyView>

            {mcpTools.map((tool) => (
              <MCPToolCard key={tool.name} {...tool} />
            ))}
          </MCPCollapsibleSection>

          <MCPCollapsibleSection title="Prompts" icon="chatbubbles">
            <GreyView className="mb-4">
              <ThemedText className="text-[1.9%] opacity-80">
                This server currently does not ship custom prompts (it focuses on resources + tools).
              </ThemedText>
            </GreyView>

            {mcpPrompts.length === 0 ? (
              <View
                className="rounded-[10px] p-4"
                style={{ backgroundColor: tintColor + '20' }}
              >
                <ThemedText className="text-[1.7%] opacity-85">
                  No prompts available.
                </ThemedText>
              </View>
            ) : (
              mcpPrompts.map((prompt) => <MCPPromptCard key={prompt.name} {...prompt} />)
            )}
          </MCPCollapsibleSection>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

