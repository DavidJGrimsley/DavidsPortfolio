const DEFAULT_QUANTUM_API_BASE_URL = 'http://127.0.0.1:8000/v1';

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

const envBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();

export const QUANTUM_API_BASE_URL = trimTrailingSlash(
  envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : DEFAULT_QUANTUM_API_BASE_URL
);

export const QUANTUM_PORTFOLIO_URL = `${QUANTUM_API_BASE_URL}/portfolio.json`;

export const QUANTUM_DOCS_URL = QUANTUM_API_BASE_URL.endsWith('/v1')
  ? `${QUANTUM_API_BASE_URL.slice(0, -3)}/docs`
  : `${QUANTUM_API_BASE_URL}/docs`;

export const QUANTUM_API_KEY = process.env.EXPO_PUBLIC_QUANTUM_API_KEY?.trim() || '';

export function hasQuantumApiKey(): boolean {
  return QUANTUM_API_KEY.length > 0;
}

export function getQuantumApiHeaders(
  options: { includeContentType?: boolean } = {}
): Record<string, string> {
  const includeContentType = options.includeContentType ?? true;
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (QUANTUM_API_KEY) {
    headers['X-API-Key'] = QUANTUM_API_KEY;
  }

  return headers;
}
