import { loadServerRuntimeEnv } from '@/server/runtime-env';

const DEFAULT_UPSTREAM_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const PROXY_ROUTE_PREFIX = '/api/quantum-backend';
const ROUTE_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;
const DISALLOWED_PREFIXES = ['/v1/keys', '/v1/ibm/profiles'] as const;

type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS';

function normalizeUpstreamBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();
  const base =
    raw && raw.length > 0
      ? raw
      : process.env.NODE_ENV === 'production'
        ? null
        : DEFAULT_UPSTREAM_BASE_URL_LOCAL;

  if (!base) {
    return null;
  }

  const trimmed = base.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function normalizeOperationPath(pathname: string) {
  const trimmedPathname = pathname.trim();
  const routePath = trimmedPathname.startsWith(PROXY_ROUTE_PREFIX)
    ? trimmedPathname.slice(PROXY_ROUTE_PREFIX.length)
    : trimmedPathname;
  const withLeadingSlash = routePath.startsWith('/')
    ? routePath
    : `/${routePath}`;

  if (
    withLeadingSlash === '/api/public/quantum/v1' ||
    withLeadingSlash.startsWith('/api/public/quantum/v1/')
  ) {
    const suffix = withLeadingSlash.slice('/api/public/quantum/v1'.length);
    return suffix.length > 0 ? `/v1${suffix}` : '/v1';
  }

  if (
    withLeadingSlash === '/public-facing/api/quantum/v1' ||
    withLeadingSlash.startsWith('/public-facing/api/quantum/v1/')
  ) {
    const suffix = withLeadingSlash.slice('/public-facing/api/quantum/v1'.length);
    return suffix.length > 0 ? `/v1${suffix}` : '/v1';
  }

  if (withLeadingSlash === '/v1' || withLeadingSlash.startsWith('/v1/')) {
    return withLeadingSlash;
  }

  if (withLeadingSlash === '/' || withLeadingSlash.length === 0) {
    return '/v1/health';
  }

  return `/v1${withLeadingSlash}`;
}

function isDisallowedPath(path: string) {
  return DISALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function getTrimmedHeader(request: Request, name: string) {
  return request.headers.get(name)?.trim() ?? '';
}

function isTruthyQueryValue(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function isIbmHardwareBackendsRequest(path: string, searchParams: URLSearchParams) {
  if (path !== '/v1/list_backends') {
    return false;
  }

  const provider = searchParams.get('provider')?.trim().toLowerCase();
  if (provider !== 'ibm') {
    return false;
  }

  return !isTruthyQueryValue(searchParams.get('simulator_only'));
}

function isIbmHardwareProxyPath(path: string, searchParams: URLSearchParams) {
  return (
    path === '/v1/jobs/circuits' ||
    path.startsWith('/v1/jobs/') ||
    isIbmHardwareBackendsRequest(path, searchParams)
  );
}

function buildUpstreamUrl(baseUrl: string, operationPath: string, search: string) {
  const normalizedPath = operationPath.trim();

  if (/^https?:\/\//i.test(normalizedPath)) {
    return `${normalizedPath}${search}`;
  }

  if (normalizedPath === '/v1') {
    return `${baseUrl}${search}`;
  }

  if (normalizedPath.startsWith('/v1/')) {
    return `${baseUrl}${normalizedPath.slice(3)}${search}`;
  }

  return `${baseUrl}${normalizedPath}${search}`;
}

function buildSafeSearch(operationPath: string, searchParams: URLSearchParams) {
  const query = new URLSearchParams(searchParams);

  if (operationPath === '/v1/list_backends') {
    const provider = query.get('provider')?.trim().toLowerCase();
    const simulatorOnly = query.get('simulator_only');

    if (!provider) {
      query.set('provider', 'aer');
    }

    if (!simulatorOnly && query.get('provider') !== 'ibm') {
      query.set('simulator_only', 'true');
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function pickForwardHeaders(request: Request, apiKey: string) {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const requestId = request.headers.get('x-request-id');

  headers.set('Accept', accept ?? 'application/json');
  headers.set('X-API-Key', apiKey);

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (requestId) {
    headers.set('X-Request-ID', requestId);
  }

  return headers;
}

function getAllowedOrigins() {
  const raw = process.env.QUANTUM_PROXY_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return [...DEFAULT_ALLOWED_ORIGINS];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function appendVary(headers: Headers, value: string) {
  const existing = headers.get('Vary');
  if (!existing) {
    headers.set('Vary', value);
    return;
  }

  const parts = existing
    .split(',')
    .map((part) => part.trim().toLowerCase());
  if (!parts.includes(value.toLowerCase())) {
    headers.set('Vary', `${existing}, ${value}`);
  }
}

function getRequestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function isOriginAllowed(
  origin: string | null,
  allowedOrigins: readonly string[],
  requestOrigin: string | null
) {
  if (!origin) {
    return true;
  }
  if (requestOrigin && origin === requestOrigin) {
    return true;
  }
  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function mergeCors(
  request: Request,
  allowedOrigins: readonly string[],
  headers?: HeadersInit
) {
  const merged = new Headers(headers);
  merged.set('Access-Control-Allow-Methods', ROUTE_METHODS);
  merged.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Request-ID');
  const origin = request.headers.get('origin');
  const requestOrigin = getRequestOrigin(request);
  if (origin && isOriginAllowed(origin, allowedOrigins, requestOrigin)) {
    merged.set('Access-Control-Allow-Origin', origin);
    appendVary(merged, 'Origin');
  }
  return merged;
}

async function handleProxy(method: Exclude<Method, 'OPTIONS'>, request: Request) {
  loadServerRuntimeEnv(request);

  const allowedOrigins = getAllowedOrigins();
  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins, getRequestOrigin(request))) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use quantum-backend proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamBaseUrl = normalizeUpstreamBaseUrl();
  if (!upstreamBaseUrl) {
    return Response.json(
      {
        error: 'proxy_not_configured',
        message:
          'EXPO_PUBLIC_QUANTUM_API_BASE_URL is missing for production runtime and no development fallback is available.',
      },
      { status: 500, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const url = new URL(request.url);
  const operationPath = normalizeOperationPath(url.pathname);
  const requiresUserApiKey = isIbmHardwareProxyPath(operationPath, url.searchParams);

  if (isDisallowedPath(operationPath)) {
    return Response.json(
      {
        error: 'proxy_path_disallowed',
        message:
          'This route is intentionally blocked on quantum-backend. Call the upstream endpoint directly with user JWT.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const userApiKey = getTrimmedHeader(request, 'x-api-key');
  const serverApiKey = process.env.QUANTUM_BACKEND_API_KEY?.trim() ?? '';
  const apiKey = requiresUserApiKey ? userApiKey : serverApiKey;

  if (requiresUserApiKey && !apiKey) {
    return Response.json(
      {
        error: 'user_api_key_required',
        message: 'IBM hardware routes require your own Quantum API key in X-API-Key.',
      },
      { status: 401, headers: mergeCors(request, allowedOrigins) }
    );
  }

  if (!requiresUserApiKey && !apiKey) {
    return Response.json(
      {
        error: 'proxy_not_configured',
        message: 'QUANTUM_BACKEND_API_KEY is missing on the server.',
      },
      { status: 500, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamUrl = buildUpstreamUrl(
    upstreamBaseUrl,
    operationPath,
    buildSafeSearch(operationPath, url.searchParams)
  );
  const headers = pickForwardHeaders(request, apiKey);

  let body: ArrayBuffer | undefined;
  if (method !== 'GET') {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 0) {
      body = bytes;
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body,
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: mergeCors(request, allowedOrigins, upstreamResponse.headers),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'proxy_request_failed',
        message:
          error instanceof Error ? error.message : 'Unknown proxy failure',
      },
      { status: 502, headers: mergeCors(request, allowedOrigins) }
    );
  }
}

export function OPTIONS(request: Request) {
  loadServerRuntimeEnv(request);

  const allowedOrigins = getAllowedOrigins();
  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins, getRequestOrigin(request))) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use quantum-backend proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  return new Response(null, { headers: mergeCors(request, allowedOrigins) });
}

export function GET(request: Request) {
  return handleProxy('GET', request);
}

export function POST(request: Request) {
  return handleProxy('POST', request);
}

export function PUT(request: Request) {
  return handleProxy('PUT', request);
}

export function PATCH(request: Request) {
  return handleProxy('PATCH', request);
}

export function DELETE(request: Request) {
  return handleProxy('DELETE', request);
}
