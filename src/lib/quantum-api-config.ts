const DEFAULT_QUANTUM_API_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const DEFAULT_QUANTUM_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION
    : DEFAULT_QUANTUM_API_BASE_URL_LOCAL;

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';
export type QuantumEndpointAuth = 'public' | 'api_key' | 'bearer_jwt';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

const envBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();
const resolvedBaseUrl =
  envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : DEFAULT_QUANTUM_API_BASE_URL;

export const QUANTUM_API_BASE_URL = trimTrailingSlash(
  resolvedBaseUrl
);

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
