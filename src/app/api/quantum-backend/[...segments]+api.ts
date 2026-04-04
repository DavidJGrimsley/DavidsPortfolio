const DEFAULT_UPSTREAM_BASE_URL =
  'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const PROXY_ROUTE_PREFIX = '/api/quantum-backend';
const ROUTE_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://davidjgrimsley.com',
  'https://www.davidjgrimsley.com',
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

  return `/v1${withLeadingSlash}`;
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

function isOriginAllowed(origin: string | null, allowedOrigins: readonly string[]) {
  if (!origin) {
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
  merged.set('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
  const origin = request.headers.get('origin');
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    merged.set('Access-Control-Allow-Origin', origin);
    appendVary(merged, 'Origin');
  }
  return merged;
}

async function handleProxy(method: Exclude<Method, 'OPTIONS'>, request: Request) {
  const allowedOrigins = getAllowedOrigins();
  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins)) {
    return Response.json(
      {
        error: 'proxy_origin_disallowed',
        message: 'Origin is not allowed to use quantum-backend proxy.',
      },
      { status: 403, headers: mergeCors(request, allowedOrigins) }
    );
  }

  const apiKey = process.env.QUANTUM_BACKEND_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error: 'proxy_not_configured',
        message: 'QUANTUM_BACKEND_API_KEY is missing on the server.',
      },
      { status: 500, headers: mergeCors(request, allowedOrigins) }
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
      { status: 403, headers: mergeCors(request, allowedOrigins) }
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
  const allowedOrigins = getAllowedOrigins();
  if (!isOriginAllowed(request.headers.get('origin'), allowedOrigins)) {
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
