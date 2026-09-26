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

  it('sends selected IBM filters through the runtime proxy without a visitor key', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    await executeQuantumSdkEndpoint({
      method: 'GET',
      path: '/v1/list_backends?provider=ibm&simulator_only=false&min_qubits=5',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
    });
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(
      'http://localhost:3000/api/quantum-backend/v1/list_backends?provider=ibm&simulator_only=false&min_qubits=5'
    );
    expect(new Headers(calledInit.headers).get('X-API-Key')).toBeNull();
  });

  it('executes POST /qasm/run through the runtime proxy', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    const payload = { qasm: 'OPENQASM 2.0;', shots: 10 };
    const result = await executeQuantumSdkEndpoint({
      method: 'POST',
      path: '/v1/qasm/run',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      body: payload,
    });
    expect(result.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://localhost:3000/api/quantum-backend/v1/qasm/run');
    expect(calledInit.method).toBe('POST');
    expect(JSON.parse(calledInit.body as string)).toEqual(payload);
  });

  it('shows the upstream QASM error status and body', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_qasm', message: 'Bad program' }), {
      status: 422,
      statusText: 'Unprocessable Content',
      headers: { 'content-type': 'application/json' },
    }));
    await expect(executeQuantumSdkEndpoint({
      method: 'POST',
      path: '/v1/qasm/run',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      body: { qasm: 'bad' },
    })).resolves.toMatchObject({
      status: 422,
      data: { error: 'invalid_qasm', message: 'Bad program' },
    });
  });

  it('executes local POST /random through the runtime proxy', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    const result = await executeQuantumSdkEndpoint({
      method: 'POST',
      path: '/v1/random',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      body: { min: 0, max: 1 },
    });
    expect(result.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://localhost:3000/api/quantum-backend/v1/random');
    expect(calledInit.method).toBe('POST');
    expect(JSON.parse(calledInit.body as string)).toEqual({ min: 0, max: 1 });
  });

  it('forwards newly discovered portfolio endpoints through the runtime proxy', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    const payload = {
      braid: ['sigma1', 'sigma2_inverse'],
      initial_state: 'vacuum',
      shots: 64,
    };

    const result = await executeQuantumSdkEndpoint({
      method: 'POST',
      path: '/v1/topological/braid',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      body: payload,
    });

    expect(result.status).toBe(200);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://localhost:3000/api/quantum-backend/v1/topological/braid');
    expect(calledInit.method).toBe('POST');
    expect(JSON.parse(calledInit.body as string)).toEqual(payload);
  });

  it('lets the backend validate unknown methods and paths instead of rejecting them in the frontend', async () => {
    const { executeQuantumSdkEndpoint } = loadExecutor();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Method Not Allowed' }), {
        status: 405,
        statusText: 'Method Not Allowed',
        headers: { 'content-type': 'application/json' },
      })
    );

    const result = await executeQuantumSdkEndpoint({
      method: 'GET',
      path: '/v1/qasm/run',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
    });

    expect(result).toMatchObject({
      status: 405,
      data: { detail: 'Method Not Allowed' },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/quantum-backend/v1/qasm/run',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
