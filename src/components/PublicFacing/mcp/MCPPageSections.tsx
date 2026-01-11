import React from 'react';
import { View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RFPercentage } from 'react-native-responsive-fontsize';

import { ThemedText } from '@/components/UI/ThemedText';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { GreyView } from '@/components/UI/GreyView';
import { MCPCollapsibleSection, MCPFeatureCard } from '~/src/components/PublicFacing/mcp/MCPComponents';

export type MCPHeroSectionProps = {
  title: string;
  version: string;
  description: string;
  keyFeatures: string[];
  mcpEndpointUrl: string;
  githubRepoUrl: string;
  copiedEndpoint: boolean;
  onCopyEndpoint: () => void;
  tintColor: string;
  accentColor: string;
  textColor: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  endpointLabel?: string;
};

export function MCPHeroSection({
  title,
  version,
  description,
  keyFeatures,
  mcpEndpointUrl,
  githubRepoUrl,
  copiedEndpoint,
  onCopyEndpoint,
  tintColor,
  accentColor,
  textColor,
  iconName,
  endpointLabel = '🌐 Live MCP Endpoint:',
}: MCPHeroSectionProps) {
  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
          <Ionicons name={iconName} size={40} color={tintColor} />
        </View>

        <View style={{ flex: 1, flexDirection: 'row', marginRight: 8 }}>
          <ThemedText type="title" style={{ fontSize: RFPercentage(3.5) }}>
            {title}
          </ThemedText>
          <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.6, marginTop: 2, marginLeft: 8 }}>
            v{version}
          </ThemedText>
        </View>

        <View
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            marginLeft: 8,
          }}
        >
          <ThemedText style={{ fontSize: RFPercentage(1.4), color: '#fff', fontWeight: 'bold' }}>
            🔌 LIVE
          </ThemedText>
        </View>
      </View>

      <ThemedText
        style={{
          fontSize: RFPercentage(1.9),
          lineHeight: RFPercentage(2.8),
          marginBottom: 16,
          color: textColor,
        }}
      >
        {description}
      </ThemedText>

      <View style={{ marginBottom: 16 }}>
        <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 10, color: textColor }}>
          ✨ Key Features
        </ThemedText>
        <View style={{ paddingLeft: 8 }}>
          {keyFeatures.map((feature) => (
            <ThemedText
              key={feature}
              style={{
                fontSize: RFPercentage(1.8),
                lineHeight: RFPercentage(2.6),
                marginBottom: 6,
                opacity: 0.8,
                color: textColor,
              }}
            >
              • {feature}
            </ThemedText>
          ))}
        </View>
      </View>

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
              {endpointLabel}
            </ThemedText>
            <View style={{ backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.2), color: '#fff', fontWeight: 'bold' }}>LIVE</ThemedText>
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
              {mcpEndpointUrl}
            </ThemedText>

            <Pressable
              onPress={onCopyEndpoint}
              style={({ pressed }) => ({
                backgroundColor: copiedEndpoint ? '#10b981' : tintColor + '20',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons
                name={copiedEndpoint ? 'checkmark' : 'copy-outline'}
                size={20}
                color={copiedEndpoint ? '#fff' : tintColor}
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
          <ExternalLink href={githubRepoUrl}>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.8),
                fontFamily: 'monospace',
                color: tintColor,
                fontWeight: '600',
              }}
            >
              {githubRepoUrl}
            </ThemedText>
          </ExternalLink>
        </View>
      </View>
    </View>
  );
}

export function MCPWhatIsSection({ tintColor }: { tintColor: string }) {
  return (
    <MCPCollapsibleSection title="What is MCP?" icon="help-circle">
      <GreyView>
        <ThemedText style={{ fontSize: RFPercentage(1.9), lineHeight: RFPercentage(2.8), marginBottom: 16 }}>
          The <ThemedText style={{ fontWeight: '600' }}>Model Context Protocol</ThemedText> (MCP) is an open standard
          that enables AI assistants (like Claude, ChatGPT, or GitHub Copilot) to securely connect to external data
          sources, tools, and services.
        </ThemedText>

        <ThemedText style={{ fontSize: RFPercentage(2), fontWeight: '600', marginBottom: 12 }}>
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
        <ThemedText style={{ fontSize: RFPercentage(1.8), lineHeight: RFPercentage(2.6), opacity: 0.8 }}>
          Learn more about MCP at{' '}
          <ExternalLink href="https://modelcontextprotocol.io">
            <ThemedText style={{ color: tintColor, fontWeight: '600' }}>modelcontextprotocol.io</ThemedText>
          </ExternalLink>
        </ThemedText>
      </GreyView>
    </MCPCollapsibleSection>
  );
}
