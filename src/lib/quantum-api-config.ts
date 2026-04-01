const DEFAULT_QUANTUM_API_BASE_URL = 'https://davidjgrimsley.com/public-facing/api/quantum';

export const QUANTUM_AUTH_PATH = '/public-facing/api/quantum';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

const envBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();

export const QUANTUM_API_BASE_URL = trimTrailingSlash(
  envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : DEFAULT_QUANTUM_API_BASE_URL
);

export const QUANTUM_PORTFOLIO_URL = `${QUANTUM_API_BASE_URL}/portfolio.json`;
