import {
  createQuantumPublicClient,
  resolveQuantumRuntimeProxyBaseUrl,
} from '../quantum-sdk-client';

describe('quantum sdk client factory', () => {
  const fetchMock = jest.fn();
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
    }
  });

  it('calls health through a normalized /v1 base url', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'Quantum API',
          version: '0.1.0',
          qiskit_available: true,
          runtime_mode: 'qiskit',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      )
    );

    const client = createQuantumPublicClient('https://example.com/public-facing/api/quantum/');
    await expect(client.health()).resolves.toMatchObject({
      status: 'healthy',
      service: 'Quantum API',
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://example.com/public-facing/api/quantum/v1/health');
    expect(calledInit.method).toBe('GET');
  });

  it('resolves runtime proxy base url from window origin on web', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          origin: 'https://web.example.com',
        },
      },
    });

    expect(resolveQuantumRuntimeProxyBaseUrl('https://api.example.com/public-facing/api/quantum/v1')).toBe(
      'https://web.example.com/api/quantum-backend'
    );
  });

  it('resolves runtime proxy base url from configured api origin in non-web runtime', () => {
    delete (globalThis as { window?: unknown }).window;

    expect(
      resolveQuantumRuntimeProxyBaseUrl(
        'https://api.example.com/public-facing/api/quantum/v1',
        false
      )
    ).toBe('https://api.example.com/api/quantum-backend');
  });
});
