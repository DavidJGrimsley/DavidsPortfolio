const DEFAULT_UPSTREAM_BASE_URL =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const PROXY_ROUTE_PREFIX = '/api/quantum-backend';
const ROUTE_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const DISALLOWED_PREFIXES = ['/v1/keys', '/v1/ibm/profiles'] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': ROUTE_METHODS,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
};

type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS';

function normalizeUpstreamBaseUrl() {
  const raw = process.env.QUANTUM_PROXY_UPSTREAM_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_UPSTREAM_BASE_URL;
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

  return withLeadingSlash;
}

function isDisallowedPath(path: string) {
  return DISALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
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

function pickForwardHeaders(request: Request, apiKey: string) {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  const requestId = request.headers.get('x-request-id');

  headers.set('Accept', accept ?? 'application/json');
  headers.set('X-API-Key', apiKey);

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  if (requestId) {
    headers.set('X-Request-ID', requestId);
  }

  return headers;
}

function mergeCors(headers?: HeadersInit) {
  const merged = new Headers(headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    merged.set(key, value);
  });
  return merged;
}

async function handleProxy(method: Exclude<Method, 'OPTIONS'>, request: Request) {
  const apiKey = process.env.QUANTUM_BACKEND_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error: 'proxy_not_configured',
        message: 'QUANTUM_BACKEND_API_KEY is missing on the server.',
      },
      { status: 500, headers: mergeCors() }
    );
  }

  const upstreamBaseUrl = normalizeUpstreamBaseUrl();
  const url = new URL(request.url);
  const operationPath = normalizeOperationPath(url.pathname);

  if (isDisallowedPath(operationPath)) {
    return Response.json(
      {
        error: 'proxy_path_disallowed',
        message:
          'This route is intentionally blocked on quantum-backend. Call the upstream endpoint directly with user JWT.',
      },
      { status: 403, headers: mergeCors() }
    );
  }

  const upstreamUrl = buildUpstreamUrl(upstreamBaseUrl, operationPath, url.search);
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
      headers: mergeCors(upstreamResponse.headers),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'proxy_request_failed',
        message:
          error instanceof Error ? error.message : 'Unknown proxy failure',
      },
      { status: 502, headers: mergeCors() }
    );
  }
}

export function OPTIONS() {
  return new Response(null, { headers: mergeCors() });
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
