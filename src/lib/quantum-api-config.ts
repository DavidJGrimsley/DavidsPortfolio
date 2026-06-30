import { readTrimmedPublicRuntimeConfigValue } from '@/lib/runtime-config';

const DEFAULT_QUANTUM_API_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const PUBLIC_QUANTUM_API_BASE_PATH = '/api/public/quantum/v1';

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';
export type QuantumEndpointAuth = 'public' | 'api_key' | 'bearer_jwt';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function resolveQuantumApiBaseUrl() {
  const envBaseUrl = readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_QUANTUM_API_BASE_URL');

  if (envBaseUrl && envBaseUrl.length > 0) {
    return trimTrailingSlash(envBaseUrl);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing EXPO_PUBLIC_QUANTUM_API_BASE_URL in production runtime. Set an explicit mounted Quantum API base URL.'
    );
  }

  return DEFAULT_QUANTUM_API_BASE_URL_LOCAL;
}

export const QUANTUM_API_BASE_URL = resolveQuantumApiBaseUrl();

export const QUANTUM_PORTFOLIO_URL = `${QUANTUM_API_BASE_URL}/portfolio.json`;

export const QUANTUM_DOCS_URL = QUANTUM_API_BASE_URL.endsWith('/v1')
  ? `${QUANTUM_API_BASE_URL.slice(0, -3)}/docs`
  : `${QUANTUM_API_BASE_URL}/docs`;

function readBrowserLocation() {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null;
  }

  try {
    return new URL(window.location.origin);
  } catch {
    return null;
  }
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
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

export function resolveQuantumBrowserApiBaseUrl(
  configuredBaseUrl = QUANTUM_API_BASE_URL,
  isWebRuntime = typeof window !== 'undefined'
) {
  if (!isWebRuntime) {
    return configuredBaseUrl;
  }

  const runtimeOrigin = readBrowserLocation();
  if (!runtimeOrigin) {
    return configuredBaseUrl;
  }

  const configuredUrl = parseUrl(configuredBaseUrl);
  if (configuredUrl && runtimeOrigin.host === configuredUrl.host) {
    return configuredBaseUrl;
  }

  if (isLoopbackHost(runtimeOrigin.hostname) && runtimeOrigin.port === '8081') {
    return configuredBaseUrl;
  }

  return `${runtimeOrigin.origin}${PUBLIC_QUANTUM_API_BASE_PATH}`;
}

export function resolveQuantumEndpointBaseUrl(
  _auth: QuantumEndpointAuth,
  isWebRuntime = typeof window !== 'undefined'
) {
  return resolveQuantumBrowserApiBaseUrl(QUANTUM_API_BASE_URL, isWebRuntime);
}
