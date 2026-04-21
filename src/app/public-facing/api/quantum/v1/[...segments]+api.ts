import { loadServerRuntimeEnv } from '@/server/runtime-env';

const DEFAULT_QUANTUM_UPSTREAM_BASE_URL =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const PUBLIC_QUANTUM_ROUTE_PREFIX = '/public-facing/api/quantum/v1';
const ROUTE_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';

type ProxyMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function normalizeQuantumUpstreamBaseUrl(request: Request) {
  loadServerRuntimeEnv(request);

  const raw = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_QUANTUM_UPSTREAM_BASE_URL;
  const trimmed = base.replace(/\/+$/, '');
  const normalized = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;

  try {
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(normalized);

    if (
      requestUrl.host.toLowerCase() === upstreamUrl.host.toLowerCase() &&
      requestUrl.hostname.toLowerCase().endsWith('.plesk.page')
    ) {
      return DEFAULT_QUANTUM_UPSTREAM_BASE_URL;
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

function mergeCors(request: Request, headers?: HeadersInit) {
  const merged = new Headers(headers);
  const origin = request.headers.get('origin');

  merged.set('Access-Control-Allow-Methods', ROUTE_METHODS);
  merged.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-API-Key, X-Request-ID'
  );

  if (origin) {
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

async function handleQuantumPublicProxy(method: ProxyMethod, request: Request) {
  const upstreamBaseUrl = normalizeQuantumUpstreamBaseUrl(request);
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
      headers: mergeCors(request, upstreamResponse.headers),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'quantum_public_proxy_failed',
        message: error instanceof Error ? error.message : 'Unknown Quantum proxy failure',
      },
      { status: 502, headers: mergeCors(request) }
    );
  }
}

export function OPTIONS(request: Request) {
  loadServerRuntimeEnv(request);

  return new Response(null, { status: 204, headers: mergeCors(request) });
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
