import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Linking, Clipboard } from 'react-native';
import Head from 'expo-router/head';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { styles } from '@/constants/styles';
import { MobileDetailsBackgroundGradient } from '@/constants/mobileStyles';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { ExternalLink } from '@/components/ExternalLink';
import { GreyView } from '@/components/GreyView';
import {
  MCPResourceCard,
  MCPToolCard,
  MCPPromptCard,
  MCPFeatureCard,
  MCPCollapsibleSection,
  MCPCodeBlock,
} from '@/components/mcp/MCPComponents';

// Server URLs
const MCP_BASE_URL = 'https://davidjgrimsley.com/mcp/app/mrdj-app-mcp';
const MCP_ENDPOINT = 'https://davidjgrimsley.com/mcp/mrdj-app-mcp/mcp';
const GITHUB_REPO = 'https://github.com/DavidJGrimsley/mrdj-app-mcp';

export default function MCPAppPage() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [copied, setCopied] = useState(false);

  const handleCopyEndpoint = () => {
    Clipboard.setString(MCP_ENDPOINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seoTitle = 'Model Context Protocol (MCP) Server | mrdj-app-mcp | David Grimsley';
  const seoDescription =
    'MCP server exposing React Native, Expo Router, and full-stack development guides. Structured resources for AI tools, including architecture patterns, state management, database design, and deployment strategies. Open-source MCP implementation for developer knowledge sharing.';
  const seoKeywords =
    'MCP, Model Context Protocol, AI tools, developer resources, React Native, Expo Router, full-stack development, architecture patterns, state management, Drizzle ORM, Supabase, deployment guides, open-source, AI assistant, developer documentation, software engineering, David Grimsley';
  const seoImage = 'https://davidjgrimsley.com/images/mcp-app-preview.png';
  const seoUrl = 'https://davidjgrimsley.com/mcp/app';

  // MCP Resources (guides) from mrdj-app-mcp
  const mcpResources = [
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

  // MCP Tools
  const mcpTools = [
    {
      name: 'list-guides',
      title: 'List Copilot Guides',
      description: 'Return the available copilot guides as resource links',
      schema: {},
    },
  ];

  // MCP Prompts
  const mcpPrompts = [
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
      
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <View style={{ flex: 1 }}>
          <MobileDetailsBackgroundGradient />
          <View style={[styles.page, { backgroundColor: 'transparent', paddingHorizontal: 20, paddingVertical: 30, paddingBottom: 60 }]}>
          {/* Header Section */}
          <View style={{ marginBottom: 30 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              {/* Icon box */}
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: tintColor + '33',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name="git-network" size={40} color={tintColor} />
              </View>

              {/* Title + version */}
              <View style={{ flex: 1, flexDirection: 'row', marginRight: 8 }}>
                <ThemedText
                  type="title"
                  style={{
                    fontSize: RFPercentage(3.5),
                  }}
                >
                  mrdj-app-mcp
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: RFPercentage(1.6),
                    opacity: 0.6,
                    marginTop: 2,
                    marginLeft: 8,
                  }}
                >
                  v0.1.0
                </ThemedText>
              </View>

              {/* Status Badge */}
              <View
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginLeft: 8,
                }}
              >
                <ThemedText
                  style={{
                    fontSize: RFPercentage(1.4),
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  🔌 LIVE
                </ThemedText>
              </View>
            </View>

            {/* Description */}
            <ThemedText style={{ fontSize: RFPercentage(1.9), lineHeight: RFPercentage(2.8), marginBottom: 16, color: textColor }}>
              Model Context Protocol (MCP) server that surfaces React Native, Expo Router, and full-stack development
              guides as structured resources. Now live and publicly accessible! AI tools can query the
              same documentation I use for building production applications, either locally or via the hosted endpoint.
            </ThemedText>

            {/* Key Features */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 10, color: textColor }}>
                ✨ Key Features
              </ThemedText>
              <View style={{ paddingLeft: 8 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.6), marginBottom: 6, opacity: 0.8, color: textColor }}>
                  • 11 comprehensive development guides (architecture, routing, state, DB, styling, performance)
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.6), marginBottom: 6, opacity: 0.8, color: textColor }}>
                  • MCP resources for AI-powered code assistance
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.6), marginBottom: 6, opacity: 0.8, color: textColor }}>
                  • Interactive prompts for architecture, stores, and routing
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.6), marginBottom: 6, opacity: 0.8, color: textColor }}>
                  • Plesk-friendly deployment (also Docker, VPS, serverless)
                </ThemedText>
              </View>
            </View>

            {/* Server URLs */}
            <View style={{ gap: 12 }}>
              <View
                style={{
                  backgroundColor: accentColor,
                  borderRadius: 10,
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: '#10b981',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.7, flex: 1 }}>
                    🌐 Live MCP Endpoint (SSE):
                  </ThemedText>
                  <View style={{ backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.2), color: '#fff', fontWeight: 'bold' }}>
                      LIVE
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText
                    style={{
                      fontSize: RFPercentage(1.8),
                      fontFamily: 'monospace',
                      color: tintColor,
                      fontWeight: '600',
                      flex: 1,
                    }}
                  >
                    {MCP_ENDPOINT}
                  </ThemedText>
                  <Pressable
                    onPress={handleCopyEndpoint}
                    style={({ pressed }) => ({
                      backgroundColor: copied ? '#10b981' : tintColor + '20',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={20}
                      color={copied ? '#fff' : tintColor}
                    />
                  </Pressable>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: accentColor,
                  borderRadius: 10,
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: tintColor,
                }}
              >
                <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.7, marginBottom: 6 }}>
                  💻 Source Code (GitHub):
                </ThemedText>
                <ExternalLink href={GITHUB_REPO}>
                  <ThemedText
                    style={{
                      fontSize: RFPercentage(1.8),
                      fontFamily: 'monospace',
                      color: tintColor,
                      fontWeight: '600',
                    }}
                  >
                    {GITHUB_REPO}
                  </ThemedText>
                </ExternalLink>
              </View>
            </View>
          </View>

          {/* What is MCP? Section */}
          <MCPCollapsibleSection title="What is MCP?" icon="help-circle">
            <GreyView>
              <ThemedText style={{ fontSize: RFPercentage(1.9), lineHeight: RFPercentage(2.8), marginBottom: 16 }}>
                The <ThemedText style={{ fontWeight: '600' }}>Model Context Protocol</ThemedText> (MCP) is an open
                standard that enables AI assistants (like Claude, ChatGPT, or GitHub Copilot) to securely connect to
                external data sources, tools, and services.
              </ThemedText>

              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                Why MCP Matters
              </ThemedText>
            </GreyView>

            <MCPFeatureCard
              icon="cube"
              title="Structured Knowledge"
              description="Exposes documentation and guides as structured resources that AI can query efficiently"
            />

            <MCPFeatureCard
              icon="code-working"
              title="Context-Aware Assistance"
              description="AI tools can access your exact architecture patterns, conventions, and best practices"
            />

            <MCPFeatureCard
              icon="construct"
              title="Interactive Tools"
              description="Provides prompts and tools that AI can invoke to generate boilerplate or answer questions"
            />

            <MCPFeatureCard
              icon="shield-checkmark"
              title="Secure & Local"
              description="Runs locally or on your infrastructure, keeping your proprietary knowledge under your control"
            />

            <GreyView style={{ marginTop: 12 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(1.8),
                  lineHeight: RFPercentage(2.6),
                  opacity: 0.8,
                }}
              >
                Learn more about MCP at{' '}
                <ExternalLink href="https://modelcontextprotocol.io">
                  <ThemedText style={{ color: tintColor, fontWeight: '600' }}>
                    modelcontextprotocol.io
                  </ThemedText>
                </ExternalLink>
              </ThemedText>
            </GreyView>
          </MCPCollapsibleSection>

          {/* Available Resources Section */}
          <MCPCollapsibleSection title="Available Resources" icon="library">
            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.9), opacity: 0.8 }}>
                The following guides are exposed as MCP resources. AI tools can read and reference these documents when
                assisting with development tasks.
              </ThemedText>
            </GreyView>

            {mcpResources.map((resource) => (
              <MCPResourceCard key={resource.id} {...resource} />
            ))}

            <View
              style={{
                backgroundColor: tintColor + '20',
                borderRadius: 10,
                padding: 16,
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color={tintColor} style={{ marginRight: 8 }} />
                <ThemedText style={{ fontSize: RFPercentage(1.8), fontWeight: '600' }}>
                  Resource Access
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.8 }}>
                AI assistants can read any of these resources by their ID (e.g., "architecture", "routing"). Each
                resource returns markdown documentation with code examples, best practices, and architectural patterns.
              </ThemedText>
            </View>
          </MCPCollapsibleSection>

          {/* Tools Section */}
          <MCPCollapsibleSection title="Tools" icon="construct">
            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.9), opacity: 0.8 }}>
                Tools are functions that AI assistants can invoke to perform specific operations.
              </ThemedText>
            </GreyView>

            {mcpTools.map((tool) => (
              <MCPToolCard key={tool.name} {...tool} />
            ))}
          </MCPCollapsibleSection>

          {/* Prompts Section */}
          <MCPCollapsibleSection title="Prompts" icon="chatbubbles">
            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.9), opacity: 0.8 }}>
                Prompts are pre-configured message templates that guide AI assistants in using the resources effectively.
              </ThemedText>
            </GreyView>

            {mcpPrompts.map((prompt) => (
              <MCPPromptCard key={prompt.name} {...prompt} />
            ))}
          </MCPCollapsibleSection>

          {/* How to Use Section */}
          <MCPCollapsibleSection title="How to Use" icon="book">
            <View
              style={{
                backgroundColor: '#dcfce7',
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
                borderLeftWidth: 4,
                borderLeftColor: '#10b981',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="rocket" size={20} color="#10b981" style={{ marginRight: 8 }} />
                <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', color: '#166534' }}>
                  Quick Start: Use the Public Endpoint
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: RFPercentage(1.7), color: '#166534' }}>
                No installation needed! Connect your AI client directly to the live endpoint:
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: RFPercentage(1.6),
                  fontFamily: 'monospace',
                  color: '#10b981',
                  fontWeight: '600',
                  marginTop: 8,
                }}
              >
                {MCP_ENDPOINT}
              </ThemedText>
            </View>

            <GreyView style={{ marginBottom: 12 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                Option 1: Use the Live Public Endpoint (Recommended)
              </ThemedText>

              <ThemedText style={{ fontSize: RFPercentage(1.8), marginBottom: 12, opacity: 0.8 }}>
                Connect to the hosted MCP server running on my VPS. Works with VS Code, Claude Desktop, and any MCP-compatible client.
              </ThemedText>

              <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.8 }}>
                For VS Code with Cline or other MCP extensions:
              </ThemedText>
            </GreyView>

            <MCPCodeBlock
              language="json"
              code={`// In your MCP client settings:
{
  "mcpServers": {
    "mrdj-app-mcp": {
      "url": "${MCP_ENDPOINT}",
      "transport": "sse"
    }
  }
}`}
            />

            <GreyView style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.8), marginBottom: 12, opacity: 0.8 }}>
                For Claude Desktop:
              </ThemedText>
            </GreyView>

            <MCPCodeBlock
              language="json"
              code={`// Add to claude_desktop_config.json:
{
  "mcpServers": {
    "mrdj-app-mcp": {
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}
            />

            <View
              style={{
                backgroundColor: '#dbeafe',
                borderRadius: 10,
                padding: 16,
                marginTop: 12,
                marginBottom: 20,
                borderLeftWidth: 3,
                borderLeftColor: '#3b82f6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                <ThemedText style={{ fontSize: RFPercentage(1.8), fontWeight: '600', color: '#1e40af' }}>
                  More Information
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: RFPercentage(1.6), color: '#1e40af' }}>
                Visit{' '}
                <ExternalLink href={MCP_BASE_URL}>
                  <ThemedText style={{ fontWeight: '600', color: '#2563eb' }}>
                    davidjgrimsley.com/mcp/mrdj-app-mcp
                  </ThemedText>
                </ExternalLink>
                {' '}for detailed setup instructions and troubleshooting.
              </ThemedText>
            </View>

            <GreyView style={{ marginBottom: 12 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                Option 2: Run Locally (stdio mode)
              </ThemedText>
            </GreyView>

            <MCPCodeBlock
              language="bash"
              code={`# Clone the repository
git clone ${GITHUB_REPO}.git
cd mrdj-app-mcp

# Install dependencies
npm install

# Build the server
npm run build

# Start the MCP server
npm start`}
            />

            <GreyView style={{ marginTop: 16, marginBottom: 12 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                2. Configure Your AI Tool
              </ThemedText>

              <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.8 }}>
                For Claude Desktop, add to your <ThemedText style={{ fontFamily: 'monospace' }}>claude_desktop_config.json</ThemedText>:
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

            <GreyView style={{ marginTop: 16, marginBottom: 16 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                3. Use in AI Conversations
              </ThemedText>

              <ThemedText style={{ fontSize: RFPercentage(1.8), marginBottom: 8, opacity: 0.8 }}>
                Once configured, your AI assistant can:
              </ThemedText>

              <View style={{ paddingLeft: 8 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Read architecture guides when discussing app structure
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Generate Zustand stores following your patterns
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Create routing checklists for new screens
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Answer database design questions with your conventions
                </ThemedText>
              </View>
            </GreyView>

            <View
              style={{
                backgroundColor: '#fef3c7',
                borderRadius: 10,
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: '#f59e0b',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="bulb" size={20} color="#f59e0b" style={{ marginRight: 8 }} />
                <ThemedText style={{ fontSize: RFPercentage(1.8), fontWeight: '600', color: '#92400e' }}>
                  Pro Tip
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: RFPercentage(1.6), color: '#92400e' }}>
                You don't need to explicitly mention the MCP server in your prompts. Once configured, the AI will
                automatically use the resources when relevant to your questions.
              </ThemedText>
            </View>
          </MCPCollapsibleSection>

          {/* Hosting Options Section */}
          <MCPCollapsibleSection title="Hosting & Deployment" icon="cloud-upload">
            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.9), opacity: 0.8 }}>
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

            <GreyView style={{ marginTop: 16, marginBottom: 12 }}>
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                }}
              >
                This Server's Deployment
              </ThemedText>
            </GreyView>

            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#10b981',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), color: '#fff', fontWeight: 'bold' }}>
                    🟢 LIVE IN PRODUCTION
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8, marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '600' }}>Environment:</ThemedText> VPS (Plesk) with Nginx reverse proxy
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8, marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '600' }}>Endpoint:</ThemedText> {MCP_ENDPOINT}
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8, marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '600' }}>Transport:</ThemedText> Server-Sent Events (SSE)
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8, marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '600' }}>Accessibility:</ThemedText> Public - Anyone can connect
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
                <ThemedText style={{ fontWeight: '600' }}>Info Page:</ThemedText>{' '}
                <ExternalLink href={MCP_BASE_URL}>
                  <ThemedText style={{ color: tintColor, fontWeight: '600' }}>
                    davidjgrimsley.com/mcp/mrdj-app-mcp
                  </ThemedText>
                </ExternalLink>
              </ThemedText>
            </View>
          </MCPCollapsibleSection>

          {/* Use Cases Section */}
          <MCPCollapsibleSection title="Use Cases" icon="apps">
            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                🎓 Learning & Education
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
                Students and developers can explore modern React Native patterns, Expo Router conventions, and
                full-stack architecture through AI-assisted learning.
              </ThemedText>
            </View>

            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                🚀 Rapid Development
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
                Generate boilerplate code, scaffolding, and configuration files that follow established patterns,
                reducing setup time for new features.
              </ThemedText>
            </View>

            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                👔 Portfolio & Hiring
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
                Employers can see documented proof of architectural thinking, best practices knowledge, and commitment
                to maintainable, scalable code.
              </ThemedText>
            </View>

            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                🔧 Team Standardization
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
                Teams can fork and customize this MCP server to encode their own conventions, ensuring consistency
                across projects and team members.
              </ThemedText>
            </View>
          </MCPCollapsibleSection>

          {/* Tech Stack Section */}
          <MCPCollapsibleSection title="Tech Stack" icon="code-slash">
            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                Runtime & Build
              </ThemedText>
              <View style={{ paddingLeft: 8 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Node.js 18+ (ES modules)
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • TypeScript with tsc compiler
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Single entrypoint: build/index.js
                </ThemedText>
              </View>
            </GreyView>

            <GreyView style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                MCP SDK
              </ThemedText>
              <View style={{ paddingLeft: 8 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • @modelcontextprotocol/sdk 1.25.x
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Zod for schema validation
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Stdio transport (local development)
                </ThemedText>
              </View>
            </GreyView>

            <GreyView>
              <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 8 }}>
                Content
              </ThemedText>
              <View style={{ paddingLeft: 8 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • File-based markdown guides
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • 11 comprehensive development guides
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.7), marginBottom: 6, opacity: 0.8 }}>
                  • Covers: React Native, Expo Router, Zustand, Drizzle, Supabase, deployment
                </ThemedText>
              </View>
            </GreyView>
          </MCPCollapsibleSection>

          {/* Resources & Links Section */}
          <View style={{ marginTop: 20 }}>
            <ThemedText
              style={{
                fontSize: RFPercentage(2.4),
                fontWeight: '600',
                marginBottom: 16,
              }}
            >
              Resources & Links
            </ThemedText>

            <Pressable
              onPress={() => Linking.openURL(GITHUB_REPO)}
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="logo-github" size={24} color={textColor} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.9), fontWeight: '600' }}>
                  GitHub Repository
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.7 }}>
                  Source code, guides, and documentation
                </ThemedText>
              </View>
              <Ionicons name="open-outline" size={20} color={textColor} style={{ opacity: 0.5 }} />
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://modelcontextprotocol.io')}
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="document-text" size={24} color={textColor} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.9), fontWeight: '600' }}>
                  MCP Documentation
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.7 }}>
                  Official Model Context Protocol docs
                </ThemedText>
              </View>
              <Ionicons name="open-outline" size={20} color={textColor} style={{ opacity: 0.5 }} />
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://davidjgrimsley.com')}
              style={{
                backgroundColor: accentColor,
                borderRadius: 10,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="person-circle" size={24} color={textColor} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: RFPercentage(1.9), fontWeight: '600' }}>
                  David Grimsley
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.7 }}>
                  Portfolio and other projects
                </ThemedText>
              </View>
              <Ionicons name="open-outline" size={20} color={textColor} style={{ opacity: 0.5 }} />
            </Pressable>
          </View>
        </View>
        </View>
      </ScrollView>
    </>
  );
}
