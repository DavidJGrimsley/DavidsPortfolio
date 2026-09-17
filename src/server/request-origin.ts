function readFirstHeaderValue(headers: Headers, name: string) {
  return headers.get(name)?.split(',')[0]?.trim() ?? '';
}

function normalizeProtocol(value: string) {
  const normalized = value.trim().replace(/:$/, '').toLowerCase();
  return normalized === 'http' || normalized === 'https' ? normalized : '';
}

function parseOrigin(value: string | null | undefined) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function parseUrl(value: string | null | undefined) {
  try {
    return new URL(String(value ?? ''));
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  );
}

function isHttpsHostedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'davidjgrimsley.com' ||
    normalized === 'www.davidjgrimsley.com' ||
    normalized.endsWith('.plesk.page')
  );
}

function canonicalizeHostedOrigin(origin: string | null) {
  if (!origin) {
    return null;
  }

  const parsed = parseUrl(origin);
  if (!parsed) {
    return null;
  }

  if (
    parsed.protocol === 'http:' &&
    !isLoopbackHostname(parsed.hostname) &&
    isHttpsHostedHostname(parsed.hostname)
  ) {
    parsed.protocol = 'https:';
  }

  return parsed.origin;
}

function sameHost(left: string | null, right: string | null) {
  const leftUrl = parseUrl(left);
  const rightUrl = parseUrl(right);
  return Boolean(leftUrl && rightUrl && leftUrl.host.toLowerCase() === rightUrl.host.toLowerCase());
}

function readConfiguredRequestOrigin() {
  return (
    parseOrigin(process.env.EXPO_PUBLIC_SITE_ORIGIN) ||
    parseOrigin(process.env.EXPO_PUBLIC_SITE_URL)
  );
}

function resolveForwardedOrigin(request: Request) {
  const forwardedHost =
    readFirstHeaderValue(request.headers, 'x-forwarded-host') ||
    readFirstHeaderValue(request.headers, 'x-original-host');
  const host = forwardedHost || readFirstHeaderValue(request.headers, 'host');
  if (!host) {
    return null;
  }

  const requestUrl = parseUrl(request.url);
  const forwardedProtocol =
    normalizeProtocol(readFirstHeaderValue(request.headers, 'x-forwarded-proto')) ||
    normalizeProtocol(readFirstHeaderValue(request.headers, 'x-forwarded-protocol')) ||
    normalizeProtocol(readFirstHeaderValue(request.headers, 'x-forwarded-scheme')) ||
    normalizeProtocol(requestUrl?.protocol ?? '') ||
    'http';

  return parseOrigin(`${forwardedProtocol}://${host}`);
}

export function resolveRequestOrigin(request: Request) {
  const configuredOrigin = readConfiguredRequestOrigin();
  const forwardedOrigin = resolveForwardedOrigin(request);
  const urlOrigin = parseOrigin(request.url);

  if (
    configuredOrigin &&
    (sameHost(configuredOrigin, forwardedOrigin) || sameHost(configuredOrigin, urlOrigin))
  ) {
    return configuredOrigin;
  }

  return (
    canonicalizeHostedOrigin(forwardedOrigin) ||
    canonicalizeHostedOrigin(urlOrigin) ||
    configuredOrigin ||
    null
  );
}
