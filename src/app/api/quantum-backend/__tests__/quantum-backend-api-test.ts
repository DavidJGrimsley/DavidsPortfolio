import { GET, POST } from '../[...segments]+api';

jest.mock('@/server/runtime-env', () => ({
  loadServerRuntimeEnv: jest.fn(),
}));

describe('quantum-backend API proxy', () => {
  const fetchMock = jest.fn();
  const originalQuantumBaseUrl = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
  const originalBackendApiKey = process.env.QUANTUM_BACKEND_API_KEY;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://example.com/public-facing/api/quantum/v1';
    process.env.QUANTUM_BACKEND_API_KEY = 'server-demo-key';
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

    if (originalBackendApiKey === undefined) {
      delete process.env.QUANTUM_BACKEND_API_KEY;
    } else {
      process.env.QUANTUM_BACKEND_API_KEY = originalBackendApiKey;
    }
  });

  it('uses the server demo key for simulator gate runs without a user key', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/quantum-backend/v1/gates/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gate_type: 'rotation', rotation_angle_rad: 1.2 }),
      })
    );

    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(calledInit.headers);

    expect(calledUrl).toBe('https://example.com/public-facing/api/quantum/v1/gates/run');
    expect(headers.get('X-API-Key')).toBe('server-demo-key');
  });

  it('requires a user API key for IBM hardware job submission', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/quantum-backend/v1/jobs/circuits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ backend_name: 'ibm_brisbane' }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'user_api_key_required',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the user API key instead of the server key for IBM hardware jobs', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/quantum-backend/v1/jobs/circuits', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'user-hardware-key',
        },
        body: JSON.stringify({ backend_name: 'ibm_brisbane' }),
      })
    );

    expect(response.status).toBe(200);
    const [, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(calledInit.headers);

    expect(headers.get('X-API-Key')).toBe('user-hardware-key');
  });

  it('uses the server key for IBM hardware backend discovery', async () => {
    const response = await GET(
      new Request(
        'http://localhost:3000/api/quantum-backend/v1/list_backends?provider=ibm&simulator_only=false',
        {
          method: 'GET',
        }
      )
    );

    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('provider=ibm&simulator_only=false');
    expect(new Headers(calledInit.headers).get('X-API-Key')).toBe('server-demo-key');
  });

  it('uses the server key for IBM simulator discovery without a profile', async () => {
    const response = await GET(new Request(
      'http://localhost:3000/api/quantum-backend/v1/list_backends?provider=ibm&simulator_only=true'
    ));

    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).not.toContain('ibm_profile');
    expect(new Headers(calledInit.headers).get('X-API-Key')).toBe('server-demo-key');
  });

  it('reports missing server configuration for IBM discovery', async () => {
    delete process.env.QUANTUM_BACKEND_API_KEY;
    const response = await GET(new Request(
      'http://localhost:3000/api/quantum-backend/v1/list_backends?provider=ibm&simulator_only=true'
    ));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'proxy_not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards QASM execution to the supported upstream POST route', async () => {
    const payload = { qasm: 'OPENQASM 2.0;', shots: 10 };
    const response = await POST(new Request('http://localhost:3000/api/quantum-backend/v1/qasm/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://example.com/public-facing/api/quantum/v1/qasm/run');
    expect(calledInit.method).toBe('POST');
    expect(new Headers(calledInit.headers).get('X-API-Key')).toBe('server-demo-key');
    expect(JSON.parse(Buffer.from(calledInit.body as ArrayBuffer).toString())).toEqual(payload);
  });

  it('defaults backend discovery to the AER simulator path for portfolio live tests', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/quantum-backend/v1/list_backends', {
        method: 'GET',
      })
    );

    expect(response.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(calledInit.headers);

    expect(calledUrl).toBe(
      'https://example.com/public-facing/api/quantum/v1/list_backends?provider=aer&simulator_only=true'
    );
    expect(headers.get('X-API-Key')).toBe('server-demo-key');
  });

  it('allows staging same-origin proxy requests when Plesk forwards to an internal http URL', async () => {
    const response = await GET(
      new Request(
        'http://quizzical-hofstadter.108-175-12-95.plesk.page/api/quantum-backend/v1/health',
        {
          method: 'GET',
          headers: {
            origin: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'quizzical-hofstadter.108-175-12-95.plesk.page',
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps bearer-only key and IBM profile routes blocked', async () => {
    const keysResponse = await GET(
      new Request('http://localhost:3000/api/quantum-backend/v1/keys', {
        method: 'GET',
      })
    );
    const profilesResponse = await GET(
      new Request('http://localhost:3000/api/quantum-backend/v1/ibm/profiles', {
        method: 'GET',
      })
    );

    expect(keysResponse.status).toBe(403);
    expect(profilesResponse.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
