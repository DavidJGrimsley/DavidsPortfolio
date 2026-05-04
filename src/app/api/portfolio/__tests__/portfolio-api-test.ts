import { GET } from '../[id]+api';

describe('portfolio API route', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'https://davidjgrimsley.com/secret/registry.json') {
        return new Response(
          JSON.stringify({
            version: '1',
            updatedAt: '2026-05-04T00:00:00.000Z',
            servers: [
              {
                id: 'quantum-echo-api',
                type: 'api',
                portfolioUrl: 'https://example.com/legacy/portfolio.json',
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      if (url === 'http://localhost:3000/api/public/quantum/v1/portfolio.json') {
        return new Response(
          JSON.stringify({
            api: {
              id: 'quantum-echo-api',
              name: 'Quantum API',
              version: '0.1.0',
              baseUrl: 'https://example.com/legacy/v1',
              docsUrl: '',
              status: 'active',
            },
            endpoints: [
              {
                method: 'GET',
                path: '/v1/list_backends',
                operationPath: '/v1/list_backends',
                summary: 'List available backends',
              },
              {
                method: 'GET',
                path: '/v1/jobs/{job_id}',
                operationPath: '/v1/jobs/{job_id}',
                summary: 'Get a circuit job',
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      return new Response(null, { status: 404 });
    });
  });

  it('decorates quantum registry data with dynamic live-test metadata', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/portfolio/quantum'),
      { id: 'quantum' }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.portfolio.api).toMatchObject({
      id: 'quantum',
      baseUrl: 'http://localhost:3000/api/public/quantum/v1',
      liveTestExecutor: 'quantum-sdk',
      auth: {
        showApiKeyDashboard: true,
      },
    });
    expect(body.data.portfolio.endpoints[0]).toMatchObject({
      liveTestPath: '/v1/list_backends?provider=aer&simulator_only=true',
    });
    expect(body.data.portfolio.endpoints[1]).toMatchObject({
      liveTestDisabledReason:
        'This endpoint needs a concrete resource identifier before it can be tested from the portfolio page.',
    });
  });
});
