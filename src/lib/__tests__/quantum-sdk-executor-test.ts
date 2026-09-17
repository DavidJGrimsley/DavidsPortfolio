describe('quantum sdk endpoint executor', () => {
  const fetchMock = jest.fn();
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalQuantumBaseUrl = mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    jest.resetModules();
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          origin: 'http://localhost:3000',
        },
      },
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ backends: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    if (originalQuantumBaseUrl === undefined) {
      delete mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
    } else {
      mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = originalQuantumBaseUrl;
    }

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
    }

    jest.resetModules();
  });

  function loadExecutor() {
    return jest.requireActual('../quantum-sdk-executor') as typeof import('../quantum-sdk-executor');
  }

  it('executes backend discovery through the simulator-safe runtime proxy query', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();

    const result = await executeQuantumSdkEndpoint({
      method: 'GET',
      path: '/v1/list_backends',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
    });

    expect(result).toMatchObject({
      status: 200,
      statusText: 'OK',
      data: { backends: [] },
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(
      'http://localhost:3000/api/quantum-backend/v1/list_backends?provider=aer&simulator_only=true'
    );
    expect(calledInit.method).toBe('GET');
  });

  it('executes authenticated key routes against the supplied browser-safe Quantum base URL', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ keys: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await executeQuantumSdkEndpoint({
      method: 'GET',
      path: '/v1/keys',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      bearerToken: 'supabase-token',
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://localhost:3000/api/public/quantum/v1/keys');
    expect(new Headers(calledInit.headers).get('Authorization')).toBe(
      'Bearer supabase-token'
    );
  });
});
