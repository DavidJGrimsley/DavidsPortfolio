import { GET, POST } from '../[...segments]+api';

jest.mock('@/server/runtime-env', () => ({
  loadServerRuntimeEnv: jest.fn(),
}));

describe('dynamic public API proxy', () => {
  const fetchMock = jest.fn();
  const originalQuantumBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/upstream/v1';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    if (originalQuantumBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = originalQuantumBaseUrl;
    }
  });

  it('proxies a quantum route through the dynamic api/public path', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/public/quantum/v1/health', {
        method: 'GET',
      }),
      { id: 'quantum', segments: ['v1', 'health'] }
    );

    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://example.com/upstream/v1/health');
    expect(calledInit.method).toBe('GET');
  });

  it('aliases the old quantum registry id to the same dynamic proxy', async () => {
    await GET(
      new Request('http://localhost:3000/api/public/quantum-echo-api/v1/portfolio.json', {
        method: 'GET',
      }),
      { id: 'quantum-echo-api', segments: 'v1/portfolio.json' }
    );

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://example.com/upstream/v1/portfolio.json');
  });

  it('allows same-host public-facing quantum backend mounts', async () => {
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';

    const response = await GET(
      new Request('https://davidjgrimsley.com/api/public/quantum/v1/health', {
        method: 'GET',
      }),
      { id: 'quantum', segments: ['v1', 'health'] }
    );

    expect(response.status).toBe(200);
    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://davidjgrimsley.com/public-facing/api/quantum/v1/health');
  });

  it('rejects same-host api/public self-proxy loops', async () => {
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/api/public/quantum/v1';

    const response = await GET(
      new Request('https://davidjgrimsley.com/api/public/quantum/v1/health', {
        method: 'GET',
      }),
      { id: 'quantum', segments: ['v1', 'health'] }
    );

    await expect(response.json()).resolves.toMatchObject({
      error: 'public_api_proxy_not_configured',
    });
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards bearer and api key headers for authenticated API surfaces', async () => {
    await POST(
      new Request('http://localhost:3000/api/public/quantum/v1/keys', {
        method: 'POST',
        headers: {
          authorization: 'Bearer user-token',
          'content-type': 'application/json',
          'x-api-key': 'client-api-key',
        },
        body: JSON.stringify({ name: 'demo key' }),
      }),
      { id: 'quantum', segments: ['v1', 'keys'] }
    );

    const [, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(calledInit.headers);
    expect(headers.get('Authorization')).toBe('Bearer user-token');
    expect(headers.get('X-API-Key')).toBe('client-api-key');
  });

  it('returns 404 for unregistered public API proxies', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/public/unknown/v1/health', {
        method: 'GET',
      }),
      { id: 'unknown', segments: ['v1', 'health'] }
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
