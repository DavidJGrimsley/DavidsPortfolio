type ApiBaseUrlConfig = {
  baseUrl: string;
  publicBasePath?: string;
};

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

function isBrowserUrlProtocolSafe(runtimeOrigin: URL, configuredUrl: URL) {
  return !(runtimeOrigin.protocol === 'https:' && configuredUrl.protocol === 'http:');
}

export function resolveBrowserApiBaseUrl(
  api: ApiBaseUrlConfig,
  isWebRuntime: boolean
) {
  const configuredBaseUrl = api.baseUrl;
  const publicBasePath = api.publicBasePath;

  if (!isWebRuntime) {
    return configuredBaseUrl;
  }

  const runtimeOrigin = readBrowserLocation();
  if (!runtimeOrigin || !publicBasePath) {
    return configuredBaseUrl;
  }

  const configuredUrl = parseUrl(configuredBaseUrl);
  if (
    configuredUrl &&
    runtimeOrigin.host === configuredUrl.host &&
    isBrowserUrlProtocolSafe(runtimeOrigin, configuredUrl)
  ) {
    return configuredBaseUrl;
  }

  if (isLoopbackHost(runtimeOrigin.hostname) && runtimeOrigin.port === '8081') {
    return configuredBaseUrl;
  }

  return `${runtimeOrigin.origin}${publicBasePath}`;
}
