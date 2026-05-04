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
  endpointLabel = 'Live MCP Endpoint',
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

      <View
        style={{
          backgroundColor: accentColor,
          borderLeftWidth: 4,
          borderLeftColor: tintColor,
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <ThemedText style={{ fontSize: RFPercentage(1.8), fontWeight: '600', color: textColor, marginBottom: 8 }}>
          {endpointLabel}
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ThemedText
            style={{
              flex: 1,
              color: tintColor,
              fontFamily: 'monospace',
              fontSize: RFPercentage(1.6),
              lineHeight: RFPercentage(2.3),
            }}
          >
            {mcpEndpointUrl}
          </ThemedText>
          <Pressable
            onPress={onCopyEndpoint}
            accessibilityRole="button"
            accessibilityLabel="Copy MCP endpoint"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: copiedEndpoint ? '#22c55e' : tintColor + '22',
            }}
          >
            <Ionicons name={copiedEndpoint ? 'checkmark' : 'copy-outline'} size={20} color={copiedEndpoint ? '#fff' : tintColor} />
          </Pressable>
        </View>
      </View>

      <ExternalLink
        href={githubRepoUrl}
        style={{
          borderColor: tintColor,
          borderWidth: 1,
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="logo-github" size={20} color={tintColor} style={{ marginRight: 8 }} />
        <ThemedText style={{ color: tintColor, fontWeight: '600' }}>View on GitHub</ThemedText>
      </ExternalLink>
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
