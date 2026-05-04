import { loadServerRuntimeEnv } from '@/server/runtime-env';

const QUANTUM_ROUTE_ID = 'quantum';
const QUANTUM_LEGACY_IDS = new Set([QUANTUM_ROUTE_ID, 'quantum-echo-api']);
const DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const ROUTE_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

type ProxyMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RouteContext = {
  id: string;
  segments?: string | string[];
};

function normalizeRouteId(id: string) {
  const normalized = id.trim().toLowerCase();
  return QUANTUM_LEGACY_IDS.has(normalized) ? QUANTUM_ROUTE_ID : normalized;
}

function isSupportedPublicApi(id: string) {
  return normalizeRouteId(id) === QUANTUM_ROUTE_ID;
}

function getPublicProxyBasePath(id: string) {
  return `/api/public/${normalizeRouteId(id)}/v1`;
}

function normalizeQuantumUpstreamBaseUrl(request: Request, routeId: string) {
  loadServerRuntimeEnv(request);

  const raw = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();
  const base =
    raw && raw.length > 0
      ? raw
      : process.env.NODE_ENV === 'production'
        ? null
        : DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL;

  if (!base) {
    return null;
  }

  const trimmed = base.replace(/\/+$/, '');
  const normalized = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;

  try {
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(normalized);
    const publicProxyBasePath = getPublicProxyBasePath(routeId);
    const legacyPublicBasePath = `/public-facing/api/${routeId}/v1`;

    if (
      requestUrl.host.toLowerCase() === upstreamUrl.host.toLowerCase() &&
      (upstreamUrl.pathname === publicProxyBasePath ||
        upstreamUrl.pathname.startsWith(`${publicProxyBasePath}/`) ||
        upstreamUrl.pathname === legacyPublicBasePath ||
        upstreamUrl.pathname.startsWith(`${legacyPublicBasePath}/`))
    ) {
      return null;
    }
  } catch {
    // Keep the configured/default upstream when URL parsing fails.
  }

  return normalized;
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
  const origin = request.headers.get('origin');

  merged.set('Access-Control-Allow-Methods', ROUTE_METHODS);
  merged.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-API-Key, X-Request-ID'
  );

  if (origin && isOriginAllowed(origin, allowedOrigins, getRequestOrigin(request))) {
    merged.set('Access-Control-Allow-Origin', origin);
    appendVary(merged, 'Origin');
  }

  return merged;
}

function normalizeRouteSuffix(segments?: string | string[]) {
  const rawSegments = Array.isArray(segments)
    ? segments
    : typeof segments === 'string'
      ? segments.split('/')
      : [];
  const parts = rawSegments.map((segment) => segment.trim()).filter(Boolean);
  if (parts[0] === 'v1') {
    parts.shift();
  }

  return parts.length > 0 ? `/${parts.map(encodeURIComponent).join('/')}` : '';
}

function buildUpstreamUrl(request: Request, upstreamBaseUrl: string, context: RouteContext) {
  const requestUrl = new URL(request.url);
  const suffix = normalizeRouteSuffix(context.segments);
  return `${upstreamBaseUrl}${suffix}${requestUrl.search}`;
}

function pickForwardHeaders(request: Request) {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const apiKey = request.headers.get('x-api-key');
  const requestId = request.headers.get('x-request-id');

  headers.set('Accept', accept ?? 'application/json');

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  if (requestId) {
    headers.set('X-Request-ID', requestId);
  }

  return headers;
}

async function readRequestBody(method: ProxyMethod, request: Request) {
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function handlePublicApiProxy(
  method: ProxyMethod,
  request: Request,
  context: RouteContext
) {
  const routeId = normalizeRouteId(context.id);
  const allowedOrigins = getAllowedOrigins();

  if (!isSupportedPublicApi(routeId)) {
    return Response.json(
      {
        error: 'public_api_proxy_not_found',
        message: `No public API proxy is registered for "${context.id}".`,
      },
      { status: 404, headers: mergeCors(request, allowedOrigins) }
    );
  }

  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins, getRequestOrigin(request))) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use this public API proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamBaseUrl = normalizeQuantumUpstreamBaseUrl(request, routeId);
  if (!upstreamBaseUrl) {
    return Response.json(
      {
        error: 'public_api_proxy_not_configured',
        message:
          'EXPO_PUBLIC_QUANTUM_API_BASE_URL must point to the upstream Quantum API service, not this public proxy route.',
      },
      { status: 500, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamUrl = buildUpstreamUrl(request, upstreamBaseUrl, context);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: pickForwardHeaders(request),
      body: await readRequestBody(method, request),
      redirect: 'manual',
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: mergeCors(request, allowedOrigins, upstreamResponse.headers),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'public_api_proxy_failed',
        message: error instanceof Error ? error.message : 'Unknown public API proxy failure',
      },
      { status: 502, headers: mergeCors(request, allowedOrigins) }
    );
  }
}

export function OPTIONS(request: Request, context: RouteContext) {
  loadServerRuntimeEnv(request);
  const allowedOrigins = getAllowedOrigins();

  if (!isSupportedPublicApi(context.id)) {
    return Response.json(
      {
        error: 'public_api_proxy_not_found',
        message: `No public API proxy is registered for "${context.id}".`,
      },
      { status: 404, headers: mergeCors(request, allowedOrigins) }
    );
  }

  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins, getRequestOrigin(request))) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use this public API proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  return new Response(null, { status: 204, headers: mergeCors(request, allowedOrigins) });
}

export function GET(request: Request, context: RouteContext) {
  return handlePublicApiProxy('GET', request, context);
}

export function HEAD(request: Request, context: RouteContext) {
  return handlePublicApiProxy('HEAD', request, context);
}

export function POST(request: Request, context: RouteContext) {
  return handlePublicApiProxy('POST', request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return handlePublicApiProxy('PUT', request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return handlePublicApiProxy('PATCH', request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return handlePublicApiProxy('DELETE', request, context);
}
