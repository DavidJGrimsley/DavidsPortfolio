const DEFAULT_QUANTUM_API_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';
export type QuantumEndpointAuth = 'public' | 'api_key' | 'bearer_jwt';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function resolveQuantumApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();

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

export function resolveQuantumEndpointBaseUrl(
  _auth: QuantumEndpointAuth,
  _isWebRuntime = typeof window !== 'undefined'
) {
  // Client calls should always use the configured public base URL.
  return QUANTUM_API_BASE_URL;
}
