const DEFAULT_QUANTUM_API_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const DEFAULT_QUANTUM_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? DEFAULT_QUANTUM_API_BASE_URL_PRODUCTION
    : DEFAULT_QUANTUM_API_BASE_URL_LOCAL;
const LOCAL_WEB_QUANTUM_PROXY_BASE_URL = '/public-facing/api/quantum/v1';

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

const envBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();
const browserLocation =
  typeof window !== 'undefined' && window.location ? window.location : null;
const isLocalWebRuntime =
  !!browserLocation &&
  (browserLocation.hostname === 'localhost' ||
    browserLocation.hostname === '127.0.0.1' ||
    browserLocation.hostname === '::1') &&
  browserLocation.port === '3000';

function shouldUseLocalWebProxyUrl(candidateUrl?: string) {
  if (!isLocalWebRuntime) return false;
  if (!candidateUrl || candidateUrl.length === 0) return true;
  if (!/^https?:\/\//i.test(candidateUrl)) return false;

  try {
    const hostname = new URL(candidateUrl).hostname.toLowerCase();
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
  } catch {
    return false;
  }
}

const resolvedBaseUrl = shouldUseLocalWebProxyUrl(envBaseUrl)
  ? LOCAL_WEB_QUANTUM_PROXY_BASE_URL
  : envBaseUrl && envBaseUrl.length > 0
    ? envBaseUrl
    : DEFAULT_QUANTUM_API_BASE_URL;

export const QUANTUM_API_BASE_URL = trimTrailingSlash(
  resolvedBaseUrl
);

export const QUANTUM_PORTFOLIO_URL = `${QUANTUM_API_BASE_URL}/portfolio.json`;

export const QUANTUM_DOCS_URL = QUANTUM_API_BASE_URL.endsWith('/v1')
  ? `${QUANTUM_API_BASE_URL.slice(0, -3)}/docs`
  : `${QUANTUM_API_BASE_URL}/docs`;
