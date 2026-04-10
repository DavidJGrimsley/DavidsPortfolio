import { QuantumApiClient } from '@mr.dj2u/quantum-api';
import { QUANTUM_API_BASE_URL } from '@/lib/quantum-api-config';

const RUNTIME_PROXY_PATH = '/api/quantum-backend';
const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1']);

function resolveSdkFetchImpl() {
  const runtimeFetch = globalThis.fetch;
  if (typeof runtimeFetch !== 'function') {
    return undefined;
  }

  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }

  return runtimeFetch.bind(globalThis);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function resolveRuntimeProxyOverride(isWebRuntime: boolean) {
  const rawOverride = process.env.EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL?.trim();
  if (!rawOverride) {
    return null;
  }

  if (/^https?:\/\//i.test(rawOverride)) {
    return trimTrailingSlash(rawOverride);
  }

  if (!rawOverride.startsWith('/')) {
    throw new Error(
      'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL must be an absolute URL or an absolute path.'
    );
  }

  if (!isWebRuntime || typeof window === 'undefined' || !window.location?.origin) {
    throw new Error(
      'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL must be an absolute URL in non-web runtimes.'
    );
  }

  return `${window.location.origin}${trimTrailingSlash(rawOverride)}`;
}

export function resolveQuantumRuntimeProxyBaseUrl(
  configuredBaseUrl = QUANTUM_API_BASE_URL,
  isWebRuntime = typeof window !== 'undefined'
) {
  const override = resolveRuntimeProxyOverride(isWebRuntime);
  if (override) {
    return override;
  }

  if (isWebRuntime && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${RUNTIME_PROXY_PATH}`;
  }

  try {
    const parsed = new URL(configuredBaseUrl);
    if (
      !isWebRuntime &&
      parsed.protocol === 'http:' &&
      LOCALHOST_NAMES.has(parsed.hostname.toLowerCase()) &&
      parsed.port === '8000'
    ) {
      throw new Error(
        'Cannot infer runtime proxy origin from local upstream URL. Set EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL (for example http://127.0.0.1:3000/api/quantum-backend).'
      );
    }

    return `${parsed.origin}${RUNTIME_PROXY_PATH}`;
  } catch {
    if (isWebRuntime) {
      return RUNTIME_PROXY_PATH;
    }

    throw new Error(
      'Unable to resolve an absolute runtime proxy URL for non-web runtime. Set EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL.'
    );
  }
}

export function createQuantumPublicClient(baseUrl = QUANTUM_API_BASE_URL) {
  const fetchImpl = resolveSdkFetchImpl();
  return new QuantumApiClient({
    baseUrl,
    defaultAuthMode: 'auto',
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export function createQuantumBearerClient(baseUrl: string, bearerToken: string) {
  const fetchImpl = resolveSdkFetchImpl();
  return new QuantumApiClient({
    baseUrl,
    bearerToken,
    defaultAuthMode: 'auto',
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export function createQuantumRuntimeProxyClient(baseUrl = QUANTUM_API_BASE_URL) {
  const fetchImpl = resolveSdkFetchImpl();
  return new QuantumApiClient({
    baseUrl: resolveQuantumRuntimeProxyBaseUrl(baseUrl),
    defaultAuthMode: 'none',
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}
