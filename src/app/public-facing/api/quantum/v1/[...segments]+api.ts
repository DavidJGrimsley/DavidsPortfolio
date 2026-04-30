import { loadServerRuntimeEnv } from '@/server/runtime-env';

const DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const PUBLIC_QUANTUM_ROUTE_PREFIX = '/public-facing/api/quantum/v1';
const ROUTE_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

type ProxyMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function normalizeQuantumUpstreamBaseUrl(request: Request) {
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

    if (
      requestUrl.host.toLowerCase() === upstreamUrl.host.toLowerCase() &&
      (upstreamUrl.pathname === PUBLIC_QUANTUM_ROUTE_PREFIX ||
        upstreamUrl.pathname.startsWith(`${PUBLIC_QUANTUM_ROUTE_PREFIX}/`))
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
  merged.set('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');

  if (origin && isOriginAllowed(origin, allowedOrigins, getRequestOrigin(request))) {
    merged.set('Access-Control-Allow-Origin', origin);
    appendVary(merged, 'Origin');
  }

  return merged;
}

function buildUpstreamUrl(request: Request, upstreamBaseUrl: string) {
  const requestUrl = new URL(request.url);
  const suffix = requestUrl.pathname.startsWith(PUBLIC_QUANTUM_ROUTE_PREFIX)
    ? requestUrl.pathname.slice(PUBLIC_QUANTUM_ROUTE_PREFIX.length)
    : requestUrl.pathname;

  return `${upstreamBaseUrl}${suffix}${requestUrl.search}`;
}

function pickForwardHeaders(request: Request) {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const requestId = request.headers.get('x-request-id');

  headers.set('Accept', accept ?? 'application/json');

  if (contentType) {
    headers.set('Content-Type', contentType);
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

async function handleQuantumPublicProxy(method: ProxyMethod, request: Request) {
  const allowedOrigins = getAllowedOrigins();
  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins, getRequestOrigin(request))) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use the public Quantum API proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamBaseUrl = normalizeQuantumUpstreamBaseUrl(request);
  if (!upstreamBaseUrl) {
    return Response.json(
      {
        error: 'quantum_public_proxy_not_configured',
        message:
          'EXPO_PUBLIC_QUANTUM_API_BASE_URL must point to the upstream Quantum API service, not this public proxy route.',
      },
      { status: 500, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const upstreamUrl = buildUpstreamUrl(request, upstreamBaseUrl);

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
        error: 'quantum_public_proxy_failed',
        message: error instanceof Error ? error.message : 'Unknown Quantum proxy failure',
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
        message: 'Origin is not allowed to use the public Quantum API proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  return new Response(null, { status: 204, headers: mergeCors(request, allowedOrigins) });
}

export function GET(request: Request) {
  return handleQuantumPublicProxy('GET', request);
}

export function HEAD(request: Request) {
  return handleQuantumPublicProxy('HEAD', request);
}

export function POST(request: Request) {
  return handleQuantumPublicProxy('POST', request);
}

export function PUT(request: Request) {
  return handleQuantumPublicProxy('PUT', request);
}

export function PATCH(request: Request) {
  return handleQuantumPublicProxy('PATCH', request);
}

export function DELETE(request: Request) {
  return handleQuantumPublicProxy('DELETE', request);
}
