/**
 * Dynamic MCP Detail Page with SSR Data Loader
 * Route: /public-facing/mcp/[id]
 *
 * Uses Expo Router data loaders to fetch portfolio data server-side,
 * enabling SEO-friendly rendering with data embedded in HTML.
 */
import React, { Suspense, useEffect, useState } from "react";
import { View, ScrollView, Pressable, Clipboard, Linking } from "react-native";
import {
  Link,
  useLoaderData,
  usePathname,
  type ErrorBoundaryProps,
} from "expo-router";
import Ionicons from "@/components/UI/HydratedIonicon";
import { LoadingComponent } from "@/components/UI/LoadingComponent";
import { ThemedText } from "@/components/UI/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ExternalLink } from "@/components/UI/ExternalLink";
import { GreyView } from "@/components/UI/GreyView";
import { PublicFacingDetailWrapper } from "~/src/components/PublicFacing/PublicFacingDetailWrapper";
import { SyncStatus } from "~/src/components/PublicFacing/PortfolioShared";
import {
  MCPCodeBlock,
  MCPCollapsibleSection,
  MCPFeatureCard,
  MCPResourceCard,
  MCPToolCard,
  MCPPromptCard,
} from "~/src/components/PublicFacing/mcp/MCPComponents";
import {
  MCPHeroSection,
  MCPWhatIsSection,
} from "~/src/components/PublicFacing/mcp/MCPPageSections";
import {
  DEFAULT_MCP_ID,
  getMcpFallbackPortfolio,
  getMcpFallbackRegistryEntry,
} from "@/data/mcpFallbackPortfolios";
import type {
  MCPPortfolio,
  RegistryServer,
  MCPEndpointMeta,
} from "@/types/registry";

type LoaderRequest = {
  url?: string;
};

interface PortfolioMcpResponse {
  success: boolean;
  data: {
    portfolio: MCPPortfolio;
    registryEntry: RegistryServer;
  };
  fetchedAt: string;
  source: "live" | "fallback";
  error?: string;
}

type DetailData = {
  portfolio: MCPPortfolio;
  registryEntry: RegistryServer;
  loadedAt: string;
  source: "live" | "fallback";
  params: { id: string };
  method: "data-loader" | "fallback";
};

function getRequestOrigin(request?: LoaderRequest) {
  if (!request?.url) return null;
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function getRouteId(params: Record<string, string | string[]>): string {
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id || DEFAULT_MCP_ID;
}

function createFallbackDetail(id = DEFAULT_MCP_ID): DetailData {
  return {
    portfolio: getMcpFallbackPortfolio(id),
    registryEntry: getMcpFallbackRegistryEntry(id),
    loadedAt: new Date().toISOString(),
    source: "fallback",
    params: { id },
    method: "fallback",
  };
}

// Server-side data loader
export async function loader(
  request: LoaderRequest | undefined,
  params: Record<string, string | string[]>,
) {
  const origin = getRequestOrigin(request);
  const id = getRouteId(params);

  if (origin) {
    try {
      const response = await fetch(
        `${origin}/api/portfolio/${encodeURIComponent(id)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: PortfolioMcpResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch portfolio");
      }

      const portfolio = result.data.portfolio as MCPPortfolio;
      const mcpInfo =
        portfolio?.mcp ??
        (portfolio as { server?: MCPPortfolio["mcp"] })?.server;

      // Verify this is an MCP type
      if (!mcpInfo) {
        throw new Error("Invalid portfolio type: expected MCP");
      }

      return {
        portfolio,
        registryEntry: result.data.registryEntry,
        loadedAt: result.fetchedAt,
        source: result.source,
        params: { id },
        method: "data-loader" as const,
      };
    } catch (error) {
      console.error(`[Loader /mcp/${id}] Error:`, error);
      throw error;
    }
  }

  // Static export fallback
  return createFallbackDetail(id);
}

// Error boundary for loader failures
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const accentColor = useThemeColor({}, "accent");

  return (
    <ScrollView
      contentContainerClassName="flex-1 justify-center items-center p-6"
      style={{ backgroundColor: accentColor }}
    >
      <ThemedText className="text-5xl mb-4">❌</ThemedText>
      <ThemedText type="title" className="mb-2 text-center">
        Error Loading MCP Server
      </ThemedText>
      <ThemedText className="opacity-80 text-center mb-6">
        {error.message}
      </ThemedText>

      <Pressable onPress={retry} className="bg-tint px-6 py-3 rounded-lg mb-4">
        <ThemedText className="text-white font-bold">Retry</ThemedText>
      </Pressable>

      <Link href="/public-facing/mcp" className="opacity-70">
        <ThemedText>← Back to MCP Servers</ThemedText>
      </Link>
    </ScrollView>
  );
}

function MCPDetailLoadingState({ label }: { label: string }) {
  return (
    <View className="w-full min-h-100 justify-center">
      <LoadingComponent label={label} />
    </View>
  );
}

function LoadingFallback() {
  return (
    <View className="flex-1 justify-center items-center p-6">
      <MCPDetailLoadingState label="Loading MCP details..." />
    </View>
  );
}

// Main content component using loader data
function MCPDetailContent() {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop() ?? DEFAULT_MCP_ID;
  const fallbackDetail = React.useMemo(() => createFallbackDetail(slug), [slug]);

  const data = (useLoaderData<typeof loader>() as DetailData) ?? fallbackDetail;
  const [liveDetail, setLiveDetail] = useState<DetailData | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || data.source === "live") return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchLive = async () => {
      try {
        const response = await fetch(
          `/api/portfolio/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: PortfolioMcpResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch portfolio");
        }

        const portfolio = result.data.portfolio as MCPPortfolio;
        const detail: DetailData = {
          portfolio,
          registryEntry: result.data.registryEntry,
          loadedAt: result.fetchedAt ?? new Date().toISOString(),
          source: result.source ?? "live",
          params: { id: slug },
          method: "data-loader",
        };

        if (isMounted) {
          setLiveDetail(detail);
          setLiveError(null);
        }
      } catch (err) {
        if (isMounted) {
          setLiveError(
            err instanceof Error ? err.message : "Failed to fetch live data",
          );
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
  const { portfolio, registryEntry, source } = detail;
  const mcpInfo =
    portfolio?.mcp ??
    (portfolio as { server?: MCPPortfolio["mcp"] })?.server ??
    getMcpFallbackPortfolio(slug).mcp;
  const tools = portfolio.tools ?? [];
  const resources = portfolio.resources ?? [];
  const prompts = portfolio.prompts ?? [];
  const endpoints = portfolio.endpoints ?? [];

  const accentColor = useThemeColor({}, "accent");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const isSynced = source === "live";

  const mcpId = mcpInfo.id;
  const mcpBaseUrl = `https://davidjgrimsley.com/public-facing/mcp/${mcpId}`;
  const mcpEndpointUrl =
    endpoints.find((endpoint) => endpoint.id === "mcp-endpoint")?.url ??
    `${mcpBaseUrl}/mcp`;
  const githubRepoUrl =
    mcpInfo.repoUrl ?? "https://github.com/DavidJGrimsley";
  const endpointLabel =
    mcpInfo.transport === "streamable-http"
      ? "Live MCP Endpoint (Streamable HTTP):"
      : "Live MCP Endpoint (SSE):";
  const clientTransport =
    mcpInfo.transport === "streamable-http" ? "streamable-http" : "sse";
  const transportLabel =
    mcpInfo.transport === "streamable-http"
      ? "Streamable HTTP"
      : "Server-Sent Events (SSE)";
  const iconName = mcpId.includes("pokemon") ? "paw" : "git-network";

  const handleCopyEndpoint = () => {
    Clipboard.setString(mcpEndpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = (url: string) => {
    Clipboard.setString(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const seoTitle = `${mcpInfo.name} | MCP Server | David Grimsley`;
  const seoDescription =
    mcpInfo.description ??
    `${mcpInfo.name} is an MCP server by David Grimsley. View tools, resources, prompts, and integration guides.`;

  return (
    <PublicFacingDetailWrapper
      seo={{
        title: seoTitle,
        description: seoDescription,
        path: `/public-facing/mcp/${mcpInfo.id}`,
        keywords: [
          mcpInfo.name,
          "MCP",
          "Model Context Protocol",
          "AI tools",
          ...(mcpInfo.tags ?? []),
        ],
        type: "website",
      }}
    >
      <MCPHeroSection
        title={mcpInfo.name}
        version={mcpInfo.version}
        description={
          mcpInfo.description ??
          "Model Context Protocol (MCP) server that surfaces React Native, Expo Router, and full-stack development guides as structured resources."
        }
        keyFeatures={[
          `${resources.length} development guides (synced from portfolio.json)`,
          "MCP resources for AI-powered code assistance",
          "Usable in Claude, VS Code, and any MCP-compatible client",
          `Metadata: ${isSynced ? "synced" : "fallback"}`,
        ]}
        mcpEndpointUrl={mcpEndpointUrl}
        githubRepoUrl={githubRepoUrl}
        copiedEndpoint={copied}
        onCopyEndpoint={handleCopyEndpoint}
        tintColor={tintColor}
        accentColor={accentColor}
        textColor={textColor}
        iconName={iconName}
        endpointLabel={endpointLabel}
      />

      {source !== "live" && liveError ? (
        <View className="rounded-lg p-5 mb-5 bg-yellow-900/30 border border-yellow-600/50">
          <ThemedText type="defaultSemiBold" className="mb-2 text-yellow-400">
            Live data is unavailable
          </ThemedText>
          <ThemedText className="opacity-90">
            Showing local fallback metadata. {liveError}
          </ThemedText>
        </View>
      ) : null}

      <MCPCollapsibleSection title="Resources" icon="library">
        <GreyView className="mb-4">
          <ThemedText className="detail-body opacity-80">
            The following guides are exposed as MCP resources. AI tools can read
            and reference these documents when assisting with development tasks.
          </ThemedText>
        </GreyView>

        {resources.map((resource, index) => {
          const resourceUri = resource.uri ?? "";
          const fileName = resourceUri
            ? (resourceUri.split("/").pop() ?? resourceUri)
            : (resource.name ?? `resource-${index + 1}`);
          const resourceTitle = resource.title ?? resource.name ?? fileName;
          return (
            <MCPResourceCard
              key={resource.uri ?? resource.name ?? `resource-${index + 1}`}
              id={resourceUri || resource.name || `resource-${index + 1}`}
              title={resourceTitle}
              fileName={fileName}
              description={resource.description ?? "No description available"}
              uri={resourceUri || undefined}
            />
          );
        })}

        <View
          className="rounded-2.5 p-4 mt-2"
          style={{ backgroundColor: tintColor + "20" }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle"
              size={20}
              color={tintColor}
              className="mr-2"
            />
            <ThemedText className="detail-subheader">
              Resource Access
            </ThemedText>
          </View>
          <ThemedText className="detail-meta opacity-80">
            AI assistants can read any of these resources by their ID (e.g.,
            "architecture", "routing"). Each resource returns markdown
            documentation with code examples, best practices, and architectural
            patterns.
          </ThemedText>
        </View>
      </MCPCollapsibleSection>

      <MCPCollapsibleSection title="Tools" icon="construct">
        <GreyView className="mb-4">
          <ThemedText className="detail-body opacity-80">
            Tools are functions that AI assistants can invoke to perform
            specific operations.
          </ThemedText>
        </GreyView>
        {tools.map((tool) => (
          <MCPToolCard
            key={tool.name}
            name={tool.name}
            title={tool.title ?? tool.name}
            description={tool.description ?? "No description available"}
            schema={tool.inputSchema}
          />
        ))}
      </MCPCollapsibleSection>

      <MCPCollapsibleSection title="Prompts" icon="chatbubbles">
        <GreyView className="mb-4">
          <ThemedText className="detail-body opacity-80">
            Prompts are pre-configured message templates that guide AI
            assistants in using the resources effectively.
          </ThemedText>
        </GreyView>
        {prompts.map((prompt) => (
          <MCPPromptCard
            key={prompt.name}
            name={prompt.name}
            title={prompt.title ?? prompt.name}
            description={prompt.description ?? "No description available"}
            args={prompt.arguments?.map((arg) => arg.name)}
          />
        ))}
      </MCPCollapsibleSection>

      <MCPWhatIsSection tintColor={tintColor} />

      <MCPCollapsibleSection title="How To Use" icon="book">
        <View className="bg-secondary/15 rounded-2.5 p-4 mb-5 border-l-4 border-l-tint">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="rocket"
              size={20}
              color={tintColor}
              className="mr-2"
            />
            <ThemedText className="detail-subheader">
              Quick Start: Use the Public Endpoint
            </ThemedText>
          </View>
          <ThemedText className="detail-body">
            No installation needed! Connect your AI client directly to the live
            endpoint:
          </ThemedText>
          <ThemedText
            className="detail-meta font-mono font-semibold mt-2"
            style={{ color: tintColor }}
          >
            {mcpEndpointUrl}
          </ThemedText>
        </View>

        <GreyView className="mb-3">
          <ThemedText className="detail-subheader mb-3">
            Option 1: Use the Live Public Endpoint
          </ThemedText>
          <ThemedText className="detail-body mb-3 opacity-80">
            Connect to the hosted MCP server running on my VPS. Works with VS
            Code, Claude Desktop, and any MCP-compatible client.
          </ThemedText>
          <ThemedText className="detail-body opacity-80">
            For VS Code with MCP extensions:
          </ThemedText>
        </GreyView>

        <MCPCodeBlock
          language="json"
          code={`// In your MCP client settings:
{
  "mcpServers": {
    "${mcpId}": {
      "url": "${mcpEndpointUrl}",
      "transport": "${clientTransport}"
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
    "${mcpId}": {
      "url": "${mcpEndpointUrl}"
    }
  }
}`}
        />

        <GreyView className="mb-3">
          <ThemedText className="detail-subheader mb-3">
            Option 2: Run Locally (stdio mode)
          </ThemedText>
        </GreyView>

        <MCPCodeBlock
          language="bash"
          code={`# Clone the repository
git clone ${githubRepoUrl}.git
cd ${mcpId}

# Install dependencies
npm install

# Build the server
npm run build

# Start the MCP server
npm start`}
        />

        <GreyView className="mt-4 mb-3">
          <ThemedText className="detail-subheader mb-3">
            2. Configure Your AI Tool
          </ThemedText>
          <ThemedText className="detail-body opacity-80">
            For Claude Desktop, add to your{" "}
            <ThemedText className="font-mono">
              claude_desktop_config.json
            </ThemedText>
            :
          </ThemedText>
        </GreyView>

        <MCPCodeBlock
          language="json"
          code={`{
  "mcpServers": {
    "${mcpId}": {
      "command": "node",
      "args": ["/path/to/${mcpId}/build/index.js"]
    }
  }
}`}
        />

        <View className="bg-tint/15 rounded-2.5 p-4 mt-3 mb-5 border-l-4 border-l-tint">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle"
              size={20}
              color={tintColor}
              className="mr-2"
            />
            <ThemedText className="detail-subheader">
              More Information
            </ThemedText>
          </View>
          <ThemedText className="detail-meta">
            Visit{" "}
            <ExternalLink href={mcpBaseUrl}>
              <ThemedText
                className="font-semibold"
                style={{ color: tintColor }}
              >
                {mcpBaseUrl}
              </ThemedText>
            </ExternalLink>{" "}
            for detailed setup instructions and troubleshooting.
          </ThemedText>
        </View>
      </MCPCollapsibleSection>

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
          <ThemedText className="detail-subheader">
            This Server's Deployment
          </ThemedText>
        </GreyView>

        <View className="rounded-2.5 p-4 mb-3 border-l-4 border-l-success bg-accent">
          <View className="flex-row items-center mb-3">
            <View className="bg-success px-2.5 py-1.5 rounded-xl">
              <ThemedText inverse className="badge-text">
                🟢 LIVE IN PRODUCTION
              </ThemedText>
            </View>
          </View>
          <ThemedText className="detail-body opacity-80 mb-2">
            <ThemedText className="font-semibold">Environment:</ThemedText> VPS
            (Plesk) with Nginx reverse proxy
          </ThemedText>
          <ThemedText className="detail-body opacity-80 mb-2">
            <ThemedText className="font-semibold">Endpoint:</ThemedText>{" "}
            {mcpEndpointUrl}
          </ThemedText>
          <ThemedText className="detail-body opacity-80 mb-2">
            <ThemedText className="font-semibold">Transport:</ThemedText>{" "}
            {transportLabel}
          </ThemedText>
          <ThemedText className="detail-body opacity-80 mb-2">
            <ThemedText className="font-semibold">Accessibility:</ThemedText>{" "}
            Public - Anyone can connect
          </ThemedText>
          <ThemedText className="detail-body opacity-80">
            <ThemedText className="font-semibold">Info Page:</ThemedText>{" "}
            <ExternalLink href={mcpBaseUrl}>
              <ThemedText
                className="font-semibold"
                style={{ color: tintColor }}
              >
                {mcpBaseUrl}
              </ThemedText>
            </ExternalLink>
          </ThemedText>
        </View>
      </MCPCollapsibleSection>

      {endpoints.length > 0 && (
        <MCPCollapsibleSection title="Endpoints" icon="link">
          <GreyView className="mb-4">
            <ThemedText className="detail-body opacity-80">
              This section syncs from portfolio.json when available and lists
              the endpoints exposed by this MCP server.
            </ThemedText>
          </GreyView>

          <GreyView className="mb-4">
            <ThemedText className="detail-subheader mb-2">
              Synced Metadata
            </ThemedText>
            <View className="pl-2">
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • {resources.length} resources
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • {tools.length} tools
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • {prompts.length} prompts
              </ThemedText>
              <ThemedText className="detail-body mb-1.5 opacity-80">
                • {endpoints.length} endpoints
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-2 mt-3">
              <ExternalLink href={registryEntry.portfolioUrl}>
                <ThemedText
                  className="detail-meta font-mono"
                  style={{ color: tintColor }}
                >
                  View portfolio.json
                </ThemedText>
              </ExternalLink>
              <Pressable
                onPress={() => handleCopyUrl(registryEntry.portfolioUrl)}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: tintColor + "20" }}
              >
                <ThemedText
                  className="detail-meta"
                  style={{ color: tintColor }}
                >
                  {copiedUrl === registryEntry.portfolioUrl
                    ? "Copied"
                    : "Copy URL"}
                </ThemedText>
              </Pressable>
            </View>
          </GreyView>

          {(endpoints as MCPEndpointMeta[]).map((endpoint) => (
            <View
              key={endpoint.id || endpoint.url}
              className="rounded-2.5 p-4 mb-3 border-l-4"
              style={{
                backgroundColor: accentColor,
                borderLeftColor: tintColor,
              }}
            >
              <View className="flex-row items-center mb-2">
                <View
                  className="px-2.5 py-1.5 rounded-lg mr-3"
                  style={{ backgroundColor: tintColor }}
                >
                  <ThemedText className="badge-text text-white">
                    {String(endpoint.method ?? "GET").toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText
                  className="detail-subheader flex-1"
                  style={{ color: textColor }}
                >
                  {endpoint.title}
                </ThemedText>
              </View>

              {endpoint.description ? (
                <ThemedText
                  className="detail-body opacity-75 mb-2.5"
                  style={{ color: textColor }}
                >
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
                    backgroundColor:
                      copiedUrl === endpoint.url ? tintColor : tintColor + "20",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={
                      copiedUrl === endpoint.url ? "checkmark" : "copy-outline"
                    }
                    size={20}
                    color={copiedUrl === endpoint.url ? "#fff" : tintColor}
                  />
                </Pressable>
              </View>

              {(endpoint.transport || endpoint.contentType) && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {endpoint.transport ? (
                    <View
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: tintColor + "20" }}
                    >
                      <ThemedText
                        className="detail-meta opacity-85"
                        style={{ color: textColor }}
                      >
                        Transport:{" "}
                        <ThemedText className="font-semibold">
                          {endpoint.transport}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  ) : null}
                  {endpoint.contentType ? (
                    <View
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: tintColor + "20" }}
                    >
                      <ThemedText
                        className="detail-meta opacity-85"
                        style={{ color: textColor }}
                      >
                        Content-Type:{" "}
                        <ThemedText className="font-semibold">
                          {endpoint.contentType}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ))}
        </MCPCollapsibleSection>
      )}

      <View className="mt-5">
        <ThemedText className="detail-section-header mb-4">
          Resources & Links
        </ThemedText>

        <Pressable
          onPress={() => Linking.openURL(githubRepoUrl)}
          className="rounded-2.5 p-4 mb-3 flex-row items-center"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons
            name="logo-github"
            size={24}
            color={textColor}
            className="mr-3"
          />
          <View className="flex-1">
            <ThemedText className="detail-subheader">
              GitHub Repository
            </ThemedText>
            <ThemedText className="detail-meta opacity-70">
              Source code, guides, and documentation
            </ThemedText>
          </View>
          <Ionicons
            name="open-outline"
            size={20}
            color={textColor}
            className="opacity-50"
          />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL("https://modelcontextprotocol.io")}
          className="rounded-2.5 p-4 mb-3 flex-row items-center"
          style={{ backgroundColor: accentColor }}
        >
          <Ionicons
            name="document-text"
            size={24}
            color={textColor}
            className="mr-3"
          />
          <View className="flex-1">
            <ThemedText className="detail-subheader">
              MCP Documentation
            </ThemedText>
            <ThemedText className="detail-meta opacity-70">
              Official Model Context Protocol docs
            </ThemedText>
          </View>
          <Ionicons
            name="open-outline"
            size={20}
            color={textColor}
            className="opacity-50"
          />
        </Pressable>
      </View>

      <SyncStatus isSynced={isSynced} sourceUrl={registryEntry.portfolioUrl} />
    </PublicFacingDetailWrapper>
  );
}

// Export default with Suspense wrapper
export default function MCPDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MCPDetailContent />
    </Suspense>
  );
}
