import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { styles } from '@/constants/styles';
import { RFPercentage } from 'react-native-responsive-fontsize';
import mcpServersData from '@/assets/json/mcpServers.json';

const { width: screenWidth } = Dimensions.get('window');

export default function MCPIndexPage() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  const [syncedMetaById, setSyncedMetaById] = useState<
    Record<
      string,
      | {
          version?: string;
          resources?: number;
          tools?: number;
          prompts?: number;
          isSynced: boolean;
        }
      | undefined
    >
  >({});

  const handleMCPPress = (mcpId: string) => {
    router.push(`/mcp/${mcpId}` as any);
  };

  const servers = useMemo(() => mcpServersData.mcpServers ?? [], []);

  useEffect(() => {
    let isMounted = true;

    const syncServerMeta = async (serverId: string) => {
      const portfolioUrl = `https://davidjgrimsley.com/mcp/${serverId}/portfolio.json`;
      try {
        const response = await fetch(portfolioUrl, { method: 'GET' });

        const finalResponse =
          response.status === 304
            ? await fetch(`${portfolioUrl}?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store' as any,
              })
            : response;

        if (!finalResponse.ok) throw new Error(`HTTP ${finalResponse.status}`);
        const data = await finalResponse.json();
        if (!isMounted) return;

        const version = data?.server?.version;
        const resources = Array.isArray(data?.resources) ? data.resources.length : undefined;
        const tools = Array.isArray(data?.tools) ? data.tools.length : undefined;
        const prompts = Array.isArray(data?.prompts) ? data.prompts.length : undefined;

        setSyncedMetaById((prev) => ({
          ...prev,
          [serverId]: { version, resources, tools, prompts, isSynced: true },
        }));
      } catch {
        if (!isMounted) return;
        setSyncedMetaById((prev) => ({
          ...prev,
          [serverId]: { isSynced: false },
        }));
      }
    };

    servers.forEach((server) => {
      if (server?.id) syncServerMeta(server.id);
    });

    return () => {
      isMounted = false;
    };
  }, [servers]);

  const seoTitle = 'MCP Servers | Model Context Protocol | David Grimsley Portfolio';
  const seoDescription = 
    'Explore MCP (Model Context Protocol) servers by David Grimsley. Open-source implementations exposing development guides, architecture patterns, and structured resources for AI-powered code assistance. MCP servers for React Native, Expo Router, full-stack development, and more.';
  const seoKeywords = 
    'MCP, Model Context Protocol, MCP server, AI tools, developer resources, React Native MCP, Expo Router MCP, AI code assistance, structured knowledge, open-source MCP, developer documentation, software engineering, David Grimsley, mrdj-app-mcp, AI assistant integration';
  const seoImage = 'https://davidjgrimsley.com/images/mcp-servers-preview.png';
  const seoUrl = 'https://davidjgrimsley.com/mcp';

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
              "url": "https://davidjgrimsley.com"
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
                  "item": "https://davidjgrimsley.com"
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

      <View style={[styles.page, { backgroundColor }]}>
        {/* Title Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}>
          <ThemedText type="title" style={{ fontSize: RFPercentage(4), marginBottom: 8 }}>
            MCP Servers
          </ThemedText>
          <ThemedText style={{ fontSize: RFPercentage(2), opacity: 0.7 }}>
            Model Context Protocol servers exposing structured development knowledge for AI tools
          </ThemedText>
        </View>

        <ScrollView 
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingBottom: 40,
            gap: 16
          }}
        >
          {servers.map((server) => {
            const synced = syncedMetaById[server.id];
            const version = synced?.version ?? server.version;
            const resources = synced?.resources ?? server.resources;
            const tools = synced?.tools ?? server.tools;
            const prompts = synced?.prompts ?? server.prompts;

            const isSynced = synced?.isSynced === true;
            const isOffline = synced?.isSynced === false;
            const isLive = server.status === 'active' && !isOffline;

            return (
            <Pressable
              key={server.id}
              onPress={() => handleMCPPress(server.id)}
              style={({ pressed }) => ({
                backgroundColor: accentColor,
                borderRadius: 12,
                padding: 20,
                opacity: pressed ? 0.8 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })}
            >
              {/* Header with Icon and Status */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <ThemedText style={{ fontSize: RFPercentage(4) }}>
                    {server.icon}
                  </ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
                      {server.name}
                    </ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
                      v{version}
                    </ThemedText>
                  </View>
                </View>
                
                {/* Status Badge */}
                <View style={{
                  backgroundColor: isLive ? '#10b981' : '#ef4444',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}>
                  <ThemedText style={{ 
                    fontSize: RFPercentage(1.4), 
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    {isLive ? '● LIVE' : '● OFFLINE'}
                  </ThemedText>
                </View>
              </View>

              {/* Description */}
              <ThemedText style={{ 
                fontSize: RFPercentage(1.8), 
                marginBottom: 16,
                lineHeight: RFPercentage(2.5),
                opacity: 0.8
              }}>
                {server.description}
              </ThemedText>

              {/* Stats Row */}
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 12
              }}>
                <View style={{ 
                  backgroundColor: backgroundColor,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                    📚 {resources} resources
                  </ThemedText>
                </View>
                <View style={{ 
                  backgroundColor: backgroundColor,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                    🔧 {tools} {tools === 1 ? 'tool' : 'tools'}
                  </ThemedText>
                </View>
                <View style={{ 
                  backgroundColor: backgroundColor,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                    💬 {prompts} prompts
                  </ThemedText>
                </View>
              </View>

              {/* Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {server.tags.map((tag, index) => (
                  <View 
                    key={index}
                    style={{
                      backgroundColor: tintColor + '20',
                      borderColor: tintColor + '40',
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: RFPercentage(1.3),
                      color: tintColor,
                      fontWeight: '600'
                    }}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Call to Action */}
              <View style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: backgroundColor + '40',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <ThemedText style={{ 
                  fontSize: RFPercentage(1.6),
                  color: tintColor,
                  fontWeight: 'bold'
                }}>
                  View Documentation →
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
                  Open-source MCP implementation
                </ThemedText>
              </View>
            </Pressable>
            );
          })}

          {/* What is MCP? Info Card */}
          <View style={{
            backgroundColor: accentColor,
            borderRadius: 12,
            padding: 20,
            borderWidth: 2,
            borderColor: tintColor + '60',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <ThemedText style={{ fontSize: RFPercentage(3), marginRight: 10 }}>
                💡
              </ThemedText>
              <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
                What is MCP?
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.8, lineHeight: RFPercentage(2.5), marginBottom: 12 }}>
              The Model Context Protocol (MCP) is an open standard that enables AI assistants (like Claude, ChatGPT, or GitHub Copilot) to securely connect to external data sources, tools, and services.
            </ThemedText>
            <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.8, lineHeight: RFPercentage(2.5) }}>
              These MCP servers expose structured development guides, architecture patterns, and best practices that AI tools can query to provide context-aware code assistance.
            </ThemedText>
          </View>

          {/* Coming Soon Card */}
          <View style={{
            backgroundColor: accentColor,
            borderRadius: 12,
            padding: 20,
            borderWidth: 2,
            borderColor: tintColor + '40',
            borderStyle: 'dashed',
          }}>
            <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 8 }}>
              More MCP Servers Coming Soon
            </ThemedText>
            <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.7 }}>
              Additional MCP servers in development covering API design, testing patterns, deployment workflows, and more development knowledge bases.
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
