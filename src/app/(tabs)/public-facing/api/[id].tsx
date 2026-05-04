import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, useLoaderData, usePathname, type ErrorBoundaryProps } from 'expo-router';

import { HelloWave } from '@/components/QuantumAnimation';
import { ThemedText } from '@/components/UI/ThemedText';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EndpointCard } from '~/src/components/PublicFacing/api/APIComponents';
import { ApiAuthDashboardCard } from '~/src/components/PublicFacing/api/quantum-auth-dashboard-card';
import { PublicFacingDetailWrapper } from '~/src/components/PublicFacing/PublicFacingDetailWrapper';
import { PortfolioHeader, SyncStatus } from '~/src/components/PublicFacing/PortfolioShared';
import { SITE_URL, joinUrl } from '@/constants/seo';
import type {
  APIPortfolio,
  PortfolioComponentSlot,
  PortfolioContentSection,
  PortfolioEndpoint,
  RegistryServer,
} from '@/types/registry';

type LoaderRequest = {
  url?: string;
};

type PortfolioApiResponse = {
  success: boolean;
  data: {
    portfolio: APIPortfolio;
    registryEntry: RegistryServer;
  };
  fetchedAt: string;
  source: 'live' | 'fallback';
  error?: string;
};

type DetailData = {
  portfolio: APIPortfolio;
  registryEntry: RegistryServer;
  loadedAt: string;
  source: 'live' | 'fallback';
  params: { id: string };
  method: 'data-loader' | 'fallback';
};

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function createFallbackApi(id: string): APIPortfolio {
  return {
    api: {
      id,
      name: 'Public API',
      version: '-',
      description:
        'Live portfolio metadata is unavailable. This page will hydrate from the registry API when the server responds.',
      baseUrl: '',
      docsUrl: '',
      status: 'offline',
      tags: [],
    },
    endpoints: [],
  };
}

function createFallbackDetail(id: string): DetailData {
  return {
    portfolio: createFallbackApi(id),
    registryEntry: {
      id,
      type: 'api',
      portfolioUrl: '',
    },
    loadedAt: new Date().toISOString(),
    source: 'fallback',
    params: { id },
    method: 'fallback',
  };
}

function getRequestOrigin(request?: LoaderRequest) {
  if (!request?.url) return null;
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function getRouteId(params: Record<string, string | string[]>) {
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id || 'api';
}

function isLoopbackHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  );
}

function resolveBrowserApiBaseUrl(api: APIPortfolio['api'], isWebRuntime: boolean) {
  const configuredBaseUrl = api.baseUrl;
  const publicBasePath = api.publicBasePath;

  if (!isWebRuntime || typeof window === 'undefined' || !window.location?.origin) {
    return configuredBaseUrl;
  }

  if (!publicBasePath) {
    return configuredBaseUrl;
  }

  try {
    const runtimeOrigin = new URL(window.location.origin);
    const configuredUrl = new URL(configuredBaseUrl);

    if (runtimeOrigin.host === configuredUrl.host) {
      return configuredBaseUrl;
    }

    if (isLoopbackHost(runtimeOrigin.hostname) && runtimeOrigin.port === '8081') {
      return configuredBaseUrl;
    }

    return `${runtimeOrigin.origin}${publicBasePath}`;
  } catch {
    return configuredBaseUrl || publicBasePath;
  }
}

function normalizeEndpointMethod(method: string | undefined): EndpointMethod {
  const normalizedMethod = String(method ?? 'GET').toUpperCase();
  return normalizedMethod === 'GET' ||
    normalizedMethod === 'POST' ||
    normalizedMethod === 'PUT' ||
    normalizedMethod === 'DELETE' ||
    normalizedMethod === 'PATCH'
    ? normalizedMethod
    : 'GET';
}

function getExecutablePath(endpoint: PortfolioEndpoint) {
  return endpoint.liveTestPath ?? endpoint.operationPath ?? endpoint.path;
}

function getEndpointDisabledReason(endpoint: PortfolioEndpoint) {
  if (endpoint.liveTestDisabledReason) {
    return endpoint.liveTestDisabledReason;
  }

  if (endpoint.auth === 'bearer_jwt') {
    return 'This endpoint requires a signed user JWT. Use the API key dashboard or external docs after signing in.';
  }

  return undefined;
}

function toFragmentId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildApiDetailStructuredData({
  api,
  endpoints,
  routePath,
}: {
  api: APIPortfolio['api'];
  endpoints: PortfolioEndpoint[];
  routePath: string;
}) {
  const pageUrl = joinUrl(SITE_URL, routePath);
  const endpointListUrl = `${pageUrl}#endpoints`;
  const description =
    api.description ??
    `${api.name} is a public API hosted by David Grimsley with documented endpoints and live testing metadata.`;

  return [
    {
      '@type': 'WebAPI',
      '@id': `${pageUrl}#api`,
      name: api.name,
      description,
      url: pageUrl,
      documentation: api.docsUrl || undefined,
      version: api.version,
      provider: {
        '@type': 'Person',
        name: 'David Grimsley',
        url: SITE_URL,
      },
      isAccessibleForFree: true,
      keywords: api.tags?.join(', '),
      featureList: api.features,
      mainEntityOfPage: pageUrl,
    },
    {
      '@type': 'ItemList',
      '@id': endpointListUrl,
      name: `${api.name} endpoints`,
      numberOfItems: endpoints.length,
      itemListElement: endpoints.map((endpoint, index) => {
        const operationPath = endpoint.operationPath ?? endpoint.path;
        const name = `${endpoint.method.toUpperCase()} ${operationPath}`;

        return {
          '@type': 'ListItem',
          position: index + 1,
          name,
          description: endpoint.summary,
          url: `${pageUrl}#${toFragmentId(name)}`,
        };
      }),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Public APIs',
          item: joinUrl(SITE_URL, '/public-facing/api'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: api.name,
          item: pageUrl,
        },
      ],
    },
  ];
}

export async function loader(
  request: LoaderRequest | undefined,
  params: Record<string, string | string[]>
) {
  const origin = getRequestOrigin(request);
  const routeId = getRouteId(params);

  if (!origin) {
    return createFallbackDetail(routeId);
  }

  const response = await fetch(`${origin}/api/portfolio/${encodeURIComponent(routeId)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result: PortfolioApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch portfolio');
  }

  if (!('api' in result.data.portfolio)) {
    throw new Error('Invalid portfolio type: expected API');
  }

  return {
    portfolio: result.data.portfolio as APIPortfolio,
    registryEntry: result.data.registryEntry,
    loadedAt: result.fetchedAt,
    source: result.source,
    params: { id: routeId },
    method: 'data-loader' as const,
  };
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const accentColor = useThemeColor({}, 'accent');

  return (
    <ScrollView
      contentContainerClassName="flex-1 justify-center items-center p-6"
      style={{ backgroundColor: accentColor }}
    >
      <ThemedText type="title" className="mb-2 text-center">
        Error Loading API
      </ThemedText>
      <ThemedText className="opacity-80 text-center mb-6">{error.message}</ThemedText>

      <Pressable onPress={retry} className="bg-tint px-6 py-3 rounded-lg mb-4">
        <ThemedText className="text-white font-bold">Retry</ThemedText>
      </Pressable>

      <Link href="/public-facing/api" className="opacity-70">
        <ThemedText>Back to APIs</ThemedText>
      </Link>
    </ScrollView>
  );
}

function LoadingFallback() {
  return (
    <View className="flex-1 justify-center items-center p-6">
      <ActivityIndicator size="large" />
      <ThemedText className="mt-4 opacity-70">Loading API details...</ThemedText>
    </View>
  );
}

function renderBody(body: PortfolioContentSection['body']) {
  if (!body) {
    return null;
  }

  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <View className="gap-3">
      {paragraphs.map((paragraph, index) => (
        <ThemedText
          key={`${index}:${paragraph.slice(0, 24)}`}
          className="detail-body opacity-90 text-base md:text-lg leading-relaxed"
        >
          {paragraph}
        </ThemedText>
      ))}
    </View>
  );
}

function PortfolioSectionCard({
  section,
  expanded,
  onToggle,
}: {
  section: PortfolioContentSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const isOpen = !section.collapsible || expanded;

  return (
    <View className="mb-7.5">
      {section.collapsible ? (
        <Pressable
          onPress={onToggle}
          className={`p-4 rounded-lg ${isOpen ? 'mb-4' : ''}`}
          style={{ backgroundColor: accentColor }}
        >
          <View className="flex-row items-start justify-between gap-2">
            <ThemedText
              type="subtitle"
              className="detail-section-header flex-1 text-2xl md:text-3xl"
              style={{ color: textColor }}
            >
              {section.title}
            </ThemedText>
            <ThemedText className="detail-body pt-0.5 text-lg md:text-xl" style={{ color: textColor }}>
              {isOpen ? 'v' : '>'}
            </ThemedText>
          </View>
        </Pressable>
      ) : (
        <ThemedText type="subtitle" className="detail-section-header mb-4 text-2xl md:text-3xl">
          {section.title}
        </ThemedText>
      )}

      {isOpen ? (
        <View className="p-5 rounded-lg gap-4" style={{ backgroundColor: accentColor }}>
          {renderBody(section.body)}

          {section.code ? (
            <View className="p-4 rounded-lg bg-(--color-code-bg)">
              <ScrollView horizontal>
                <ThemedText className="font-mono text-sm md:text-base text-(--color-code-text) leading-relaxed">
                  {section.code.value}
                </ThemedText>
              </ScrollView>
            </View>
          ) : null}

          {section.links?.map((link) => (
            <ExternalLink key={link.href} href={link.href} className="underline font-mono text-sm md:text-base">
              {link.label}
            </ExternalLink>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ExtraComponentSlot({ component }: { component: PortfolioComponentSlot }) {
  const accentColor = useThemeColor({}, 'accent');

  if (component.type !== 'quantum-animation') {
    return null;
  }

  return (
    <View className="mb-5">
      {component.title ? (
        <ThemedText type="subtitle" className="detail-section-header mb-4 text-2xl md:text-3xl">
          {component.title}
        </ThemedText>
      ) : null}
      <View className="p-5 rounded-lg" style={{ backgroundColor: accentColor }}>
        {component.description ? (
          <ThemedText className="detail-body opacity-90 text-center mb-4 text-lg md:text-xl leading-relaxed">
            {component.description}
          </ThemedText>
        ) : null}
        <ClientOnly>
          <HelloWave />
        </ClientOnly>
      </View>
    </View>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

function APIDetailContent() {
  const pathname = usePathname();
  const slug = pathname?.split('/').filter(Boolean).pop() ?? 'api';
  const fallbackDetail = useMemo(() => createFallbackDetail(slug), [slug]);

  const data = (useLoaderData<typeof loader>() as DetailData | undefined) ?? fallbackDetail;
  const [liveDetail, setLiveDetail] = useState<DetailData | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug || data.source === 'live') return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchLive = async () => {
      try {
        const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: PortfolioApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch portfolio');
        }

        if (isMounted) {
          setLiveDetail({
            portfolio: result.data.portfolio as APIPortfolio,
            registryEntry: result.data.registryEntry,
            loadedAt: result.fetchedAt ?? new Date().toISOString(),
            source: result.source ?? 'live',
            params: { id: slug },
            method: 'data-loader',
          });
          setLiveError(null);
        }
      } catch (err) {
        if (isMounted) {
          setLiveError(err instanceof Error ? err.message : 'Failed to fetch live data');
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
  const { portfolio, registryEntry, source, loadedAt } = detail;
  const { api } = portfolio;
  const isWebRuntime = Platform.OS === 'web';
  const apiBaseUrl = resolveBrowserApiBaseUrl(api, isWebRuntime);
  const endpoints = portfolio.endpoints ?? [];
  const sections = portfolio.sections ?? [];
  const components = portfolio.components ?? [];

  const accentColor = useThemeColor({}, 'accent');

  const statusRaw = (api.status ?? '').toLowerCase();
  const isLive =
    source === 'live' &&
    (statusRaw === 'active' || statusRaw === 'healthy' || statusRaw === 'live');
  const isSynced = source === 'live';
  const apiAuth = api.auth;
  const showApiKeyDashboard = Boolean(apiAuth?.showApiKeyDashboard);

  const executeQuantumEndpoint = useCallback(async (input: {
    method: EndpointMethod;
    path: string;
    baseUrl: string;
    body?: unknown;
  }) => {
    const { executeQuantumSdkEndpoint } = await import('@/lib/quantum-sdk-executor');
    return executeQuantumSdkEndpoint(input);
  }, []);

  const requestExecutor = api.liveTestExecutor === 'quantum-sdk' ? executeQuantumEndpoint : undefined;
  const routeId = api.id || registryEntry.id || detail.params.id;
  const routePath = `/public-facing/api/${routeId}`;
  const structuredData = buildApiDetailStructuredData({ api, endpoints, routePath });
  const seoTitle = `${api.name} API | David Grimsley`;
  const seoDescription =
    api.description ??
    `${api.name} is a public API hosted by David Grimsley. View endpoints, docs, examples, and usage notes.`;

  return (
    <PublicFacingDetailWrapper
      seo={{
        title: seoTitle,
        description: seoDescription,
        path: routePath,
        keywords: [
          api.name,
          'public API',
          'REST API',
          'developer tools',
          ...(api.tags ?? []),
        ],
        type: 'website',
        structuredData,
      }}
    >
      {source !== 'live' && liveError ? (
        <View className="rounded-lg p-4 mb-5 bg-yellow-900/30 border border-yellow-600/50">
          <ThemedText type="defaultSemiBold" className="mb-1 text-yellow-400">
            Live registry data is unavailable
          </ThemedText>
          <ThemedText className="opacity-90">{liveError}</ThemedText>
        </View>
      ) : null}

      <PortfolioHeader
        name={api.name}
        version={api.version}
        description={api.description}
        icon={api.icon && api.icon.length <= 4 ? api.icon : undefined}
        iconName={(api.iconName as never) ?? 'cloud'}
        isLive={isLive}
        baseUrl={apiBaseUrl}
        docsUrl={api.docsUrl}
        tags={api.tags}
        features={api.features}
        isSynced={isSynced}
        type="api"
      />

      {showApiKeyDashboard ? (
        <ClientOnly>
          <ApiAuthDashboardCard
            apiName={api.name}
            baseUrl={apiBaseUrl}
            dashboardDescription={apiAuth?.dashboardDescription}
            supportsIbmProfiles={Boolean(apiAuth?.supportsIbmProfiles)}
          />
        </ClientOnly>
      ) : null}

      <View className="mb-7.5">
        <ThemedText type="subtitle" className="mb-4">
          Endpoints
        </ThemedText>

        {endpoints.length > 0 ? (
          endpoints.map((endpoint) => {
            const methodForCard = normalizeEndpointMethod(endpoint.method);
            const executionPath = getExecutablePath(endpoint);

            return (
              <EndpointCard
                key={`${methodForCard}:${executionPath}`}
                method={methodForCard}
                path={executionPath}
                displayPath={endpoint.operationPath ?? endpoint.path}
                summary={endpoint.summary}
                description={endpoint.description}
                auth={endpoint.auth ?? 'public'}
                parameters={endpoint.parameters}
                requestBody={endpoint.requestBody}
                responses={endpoint.responses}
                baseUrl={apiBaseUrl}
                liveDisabledReason={getEndpointDisabledReason(endpoint)}
                requestExecutor={requestExecutor}
              />
            );
          })
        ) : (
          <View className="rounded-lg p-4" style={{ backgroundColor: accentColor }}>
            <ThemedText className="opacity-85">
              No endpoint metadata was returned for this API yet.
            </ThemedText>
          </View>
        )}
      </View>

      {sections.map((section) => (
        <PortfolioSectionCard
          key={section.id}
          section={section}
          expanded={expandedSections[section.id] ?? Boolean(section.defaultExpanded)}
          onToggle={() =>
            setExpandedSections((current) => ({
              ...current,
              [section.id]: !(current[section.id] ?? Boolean(section.defaultExpanded)),
            }))
          }
        />
      ))}

      {components.map((component) => (
        <ExtraComponentSlot key={component.id ?? component.type} component={component} />
      ))}

      <View className="mb-7.5">
        <ThemedText type="subtitle" className="mb-4">
          Technical Details
        </ThemedText>
        <View className="p-4 rounded-lg" style={{ backgroundColor: accentColor }}>
          <View className="gap-3">
            <View>
              <ThemedText type="defaultSemiBold" className="mb-1">
                Status
              </ThemedText>
              <ThemedText className="opacity-85">{api.status}</ThemedText>
            </View>
            {api.uptime ? (
              <View>
                <ThemedText type="defaultSemiBold" className="mb-1">
                  Uptime
                </ThemedText>
                <ThemedText className="opacity-85">{api.uptime}</ThemedText>
              </View>
            ) : null}
            <View>
              <ThemedText type="defaultSemiBold" className="mb-1">
                Data Loaded
              </ThemedText>
              <ThemedText className="opacity-85">
                {loadedAt} ({source})
              </ThemedText>
            </View>
            {registryEntry.portfolioUrl ? (
              <View>
                <ThemedText type="defaultSemiBold" className="mb-1">
                  Portfolio Metadata
                </ThemedText>
                <ExternalLink href={registryEntry.portfolioUrl} className="font-mono text-sm">
                  {registryEntry.portfolioUrl}
                </ExternalLink>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <SyncStatus isSynced={isSynced} sourceUrl={registryEntry.portfolioUrl} />
    </PublicFacingDetailWrapper>
  );
}

export default function APIDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <APIDetailContent />
    </Suspense>
  );
}
