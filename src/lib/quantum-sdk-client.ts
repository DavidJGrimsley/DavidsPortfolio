import { QuantumApiClient } from '@mr.dj2u/quantum-api';
import { QUANTUM_API_BASE_URL } from '@/lib/quantum-api-config';

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

export function resolveQuantumRuntimeProxyBaseUrl(
  configuredBaseUrl = QUANTUM_API_BASE_URL,
  isWebRuntime = typeof window !== 'undefined'
) {
  if (isWebRuntime && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/quantum-backend`;
  }

  try {
    const parsed = new URL(configuredBaseUrl);
    return `${parsed.origin}/api/quantum-backend`;
  } catch {
    return '/api/quantum-backend';
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
