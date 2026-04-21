import { SITE_URL } from '@/constants/seo';

const DEFAULT_SITE_ORIGIN = SITE_URL;

function parseAbsoluteSiteOrigin(rawOrigin: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new Error('EXPO_PUBLIC_SITE_ORIGIN must be a valid absolute URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_SITE_ORIGIN must use http:// or https://.');
  }

  const hasNonRootPath = parsed.pathname !== '/' && parsed.pathname !== '';
  if (hasNonRootPath || parsed.search || parsed.hash) {
    throw new Error(
      'EXPO_PUBLIC_SITE_ORIGIN must not include a path, query, or fragment. Use only the origin, for example: "https://example.com".',
    );
  }

  return parsed.origin;
}

function readConfiguredSiteOrigin(): string {
  const configuredOrigin = process.env.EXPO_PUBLIC_SITE_ORIGIN?.trim() ?? '';
  return configuredOrigin ? parseAbsoluteSiteOrigin(configuredOrigin) : '';
}

function readRuntimeWindowOrigin(): string {
  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string') {
    const runtimeOrigin = window.location.origin.trim();
    if (runtimeOrigin) {
      try {
        return parseAbsoluteSiteOrigin(runtimeOrigin);
      } catch {
        return '';
      }
    }
  }

  return '';
}

export function resolveSiteOrigin(): string {
  const configuredOrigin = readConfiguredSiteOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const runtimeOrigin = readRuntimeWindowOrigin();
  if (runtimeOrigin) {
    return runtimeOrigin;
  }

  return DEFAULT_SITE_ORIGIN;
}

export function resolveBrowserSiteOrigin(): string {
  // In a browser, the runtime origin is the source of truth for "where the
  // user is right now". Auth providers should redirect back to that origin,
  // regardless of any build-time EXPO_PUBLIC_SITE_ORIGIN. The configured
  // origin is only a fallback for SSR / non-browser callers where `window`
  // is unavailable.
  const runtimeOrigin = readRuntimeWindowOrigin();
  if (runtimeOrigin) {
    return runtimeOrigin;
  }

  const configuredOrigin = readConfiguredSiteOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  return DEFAULT_SITE_ORIGIN;
}
