import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SoftwareCard } from '~/src/components/PublicFacing/SoftwareCard';
import { ComingSoonCard } from '~/src/components/PublicFacing/ComingSoonCard';
import { WhatIsMCPCard } from '~/src/components/PublicFacing/mcp/WhatIsMCPCard';
import { PublicFacingIndexWrapper } from '~/src/components/PublicFacing/PublicFacingIndexWrapper';
import mcpServersData from '@json/mcpServers.json';

export default function MCPIndexPage() {
  const router = useRouter();

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
    router.push(`/public-facing/mcp/${mcpId}` as any);
  };

  const servers = useMemo(() => mcpServersData.mcpServers ?? [], []);

  useEffect(() => {
    let isMounted = true;

    const syncServerMeta = async (serverId: string) => {
      const portfolioUrl = `https://davidjgrimsley.com/public-facing/mcp/${serverId}/portfolio.json`;
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
    'MCP, Model Context Protocol, MCP server, AI tools, Pokémon MCP, developer resources, React Native MCP, Expo Router MCP, AI code assistance, structured knowledge, open-source MCP, developer documentation, software engineering, David Grimsley, mrdj-app-mcp, AI assistant integration';
  const seoImage = 'https://davidjgrimsley.com/images/icon.png';
  const seoUrl = 'https://davidjgrimsley.com/public-facing/mcp';

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
        leadBody="Using advanced models like Claude Sonnet and OpenAI allows me to leverage the speed and effectiveness of agentic coding, while my solid understanding of programming fundamentals, UI/UX principles, and data flow keeps projects actually working and makes architecture design and debugging my strong suit. It’s important to keep the AI agent in check. This is just one use of an MCP. I also made an MCP focused on Pokémon, which includes guides written by me and a full database of Pokémon information."
        leadSubBody="NGINX helps me host these endpoints on my VPS at DavidJGrimsley.com/whatever-i-want. This allows me to use the SSL that my website uses for HTTPS calls, which is super important in production. Please view each info page for how-to-use details and rate limits. Contact me for any problems or raise an issue on GitHub."
      >

        {/* What is MCP? Info Card */}
        <WhatIsMCPCard />
        {servers.map((server) => {
          const synced = syncedMetaById[server.id];
          const version = synced?.version ?? server.version;
          const resources = synced?.resources;
          const tools = synced?.tools;
          const prompts = synced?.prompts;
          
          const isOffline = synced?.isSynced === false;
          const isLive = server.status === 'active' && !isOffline;
          
          return (
            <SoftwareCard
            key={server.id}
            item={{
              ...server,
              version,
              status: isLive ? 'active' : 'inactive',
            }}
            stats={[
              { emoji: '📚', label: `${typeof resources === 'number' ? resources : '—'} resources` },
              { emoji: '🔧', label: `${typeof tools === 'number' ? tools : '—'} tools` },
              { emoji: '💬', label: `${typeof prompts === 'number' ? prompts : '—'} prompts` },
            ]}
            onPress={() => handleMCPPress(server.id)}
            />
          );
        })}

        {/* Coming Soon Card */}
        <ComingSoonCard
          title="More MCP Servers Coming Soon"
          description="Additional MCP servers in development covering API design, testing patterns, deployment workflows, and more development knowledge bases."
        />
      </PublicFacingIndexWrapper>
    </>
  );
}
