const DEFAULT_QUANTUM_API_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const DEFAULT_QUANTUM_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION
    : DEFAULT_QUANTUM_API_BASE_URL_LOCAL;

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
