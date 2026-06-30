import { executeQuantumSdkEndpoint } from '../quantum-sdk-executor';

describe('quantum sdk endpoint executor', () => {
  const fetchMock = jest.fn();
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
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
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
      return;
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
  });

  it('executes backend discovery through the simulator-safe runtime proxy query', async () => {
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
});
