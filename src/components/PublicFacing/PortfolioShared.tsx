/**
 * Shared header component for API and MCP detail pages
 * Used by both dynamic [id].tsx routes
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/UI/ThemedText';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PortfolioHeaderProps {
  name: string;
  version: string;
  description?: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isLive: boolean;
  baseUrl?: string;
  docsUrl?: string;
  repoUrl?: string;
  tags?: string[];
  features?: string[];
  isSynced: boolean;
  type: 'api' | 'mcp';
}

export function PortfolioHeader({
  name,
  version,
  description,
  icon,
  iconName = 'code-slash',
  isLive,
  baseUrl,
  docsUrl,
  repoUrl,
  tags,
  features,
  isSynced,
  type,
}: PortfolioHeaderProps) {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  // Determine which icon to show
  const displayIcon = iconName || (type === 'api' ? 'cloud' : 'server');

  return (
    <View className="mb-7.5">
      {/* Icon + Title + Status */}
      <View className="flex-row items-center mb-3">
        <View
          className="w-18 h-18 rounded-2xl items-center justify-center mr-4"
          style={{ backgroundColor: tintColor + '33' }}
        >
          {icon ? (
            <ThemedText className="text-4xl">{icon}</ThemedText>
          ) : (
            <Ionicons name={displayIcon} size={40} color={tintColor} />
          )}
        </View>

        <View className="flex-1 flex-row mr-2">
          <ThemedText
            type="title"
            headingLevel={1}
            visualHeadingLevel={1}
            className="font-noto-serif-display"
          >
            {name}
          </ThemedText>
          <ThemedText className="opacity-60 mt-0.5 text-sm ml-2">v{version}</ThemedText>
        </View>

        <View className={`px-3 py-1.5 rounded-xl ml-2 ${isLive ? 'bg-success' : 'bg-error'}`}>
          <ThemedText inverse className="font-bold text-xs">
            {isLive ? '● LIVE' : '● OFFLINE'}
          </ThemedText>
        </View>
      </View>

      {/* Description */}
      {description && (
        <ThemedText className="opacity-85 mb-4 leading-6">{description}</ThemedText>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <View
              key={tag}
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: tintColor + '22' }}
            >
              <ThemedText className="text-xs" style={{ color: tintColor }}>
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Features list */}
      {features && features.length > 0 && (
        <View className="mb-4">
          <ThemedText type="subtitle" className="mb-3">
            Features
          </ThemedText>
          <View className="pl-2">
            <ThemedText className="opacity-85 text-sm leading-6">
              {features.map((f, i) => `• ${f}${i < features.length - 1 ? '\n' : ''}`)}
              {'\n'}• Metadata: {isSynced ? 'synced' : 'fallback'}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Links section */}
      <View className="gap-3">
        {baseUrl && (
          <View
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: accentColor,
              borderLeftColor: tintColor,
            }}
          >
            <ThemedText type="defaultSemiBold" className="mb-1.5 text-secondary">
              {type === 'api' ? 'Base URL' : 'MCP Endpoint'}
            </ThemedText>
            <ExternalLink href={baseUrl} className="font-mono text-sm" style={{ color: tintColor }}>
              {baseUrl}
            </ExternalLink>
          </View>
        )}

        {docsUrl && (
          <ExternalLink
            href={docsUrl}
            className="py-3.5 px-5 rounded-lg flex-row items-center justify-center gap-2.5"
            style={{ backgroundColor: tintColor }}
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <ThemedText className="font-bold text-white text-base">
              {type === 'api' ? 'View Interactive API Docs (Swagger UI)' : 'View Documentation'}
            </ThemedText>
          </ExternalLink>
        )}

        {repoUrl && (
          <ExternalLink
            href={repoUrl}
            className="py-3 px-5 rounded-lg flex-row items-center justify-center gap-2.5 border"
            style={{ borderColor: tintColor }}
          >
            <Ionicons name="logo-github" size={20} color={tintColor} />
            <ThemedText className="font-semibold text-base" style={{ color: tintColor }}>
              View on GitHub
            </ThemedText>
          </ExternalLink>
        )}
      </View>
    </View>
  );
}

interface SyncStatusProps {
  isSynced: boolean;
  sourceUrl?: string;
}

export function SyncStatus({ isSynced, sourceUrl }: SyncStatusProps) {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View
      className="mt-6 rounded-lg p-3.5 flex-row items-center gap-2.5"
      style={{ backgroundColor: accentColor }}
    >
      <Ionicons
        name={isSynced ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={18}
        color={isSynced ? tintColor : textColor}
        className="opacity-90"
      />
      <ThemedText className="detail-body opacity-80 flex-1 text-base md:text-lg">
        {isSynced
          ? `Synced from ${sourceUrl ?? 'remote portfolio'}`
          : 'Live data is unavailable right now. Please try again later.'}
      </ThemedText>
    </View>
  );
}
