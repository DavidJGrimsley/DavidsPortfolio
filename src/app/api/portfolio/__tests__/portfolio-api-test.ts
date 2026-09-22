import { GET } from '../[id]+api';

describe('portfolio API route', () => {
  const fetchMock = jest.fn();
  const originalSiteOrigin = process.env.EXPO_PUBLIC_SITE_ORIGIN;

  beforeEach(() => {
    fetchMock.mockReset();
    delete process.env.EXPO_PUBLIC_SITE_ORIGIN;
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

      if (
        url === 'http://localhost:3000/api/public/quantum/v1/portfolio.json' ||
        url ===
          'https://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1/portfolio.json'
      ) {
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

  afterEach(() => {
    if (originalSiteOrigin === undefined) {
      delete process.env.EXPO_PUBLIC_SITE_ORIGIN;
    } else {
      process.env.EXPO_PUBLIC_SITE_ORIGIN = originalSiteOrigin;
    }
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
      healthUrl: 'https://davidjgrimsley.com/api/public/quantum/v1/health',
      liveTestExecutor: 'quantum-sdk',
      auth: {
        showApiKeyDashboard: true,
      },
    });
    expect(body.data.portfolio.sections[1].links[0]).toMatchObject({
      label: 'https://davidjgrimsley.com/api/public/quantum/v1/health',
      href: 'https://davidjgrimsley.com/api/public/quantum/v1/health',
    });
    expect(body.data.portfolio.sections[2].code.value).toContain(
      "'https://davidjgrimsley.com/api/public/quantum/v1/gates/run'"
    );
    expect(body.data.portfolio.endpoints[0]).toMatchObject({
      liveTestPath: '/v1/list_backends?provider=aer&simulator_only=true',
    });
    expect(body.data.portfolio.endpoints[1]).toMatchObject({
      liveTestDisabledReason:
        'This endpoint needs a concrete resource identifier before it can be tested from the portfolio page.',
    });
  });

  it('decorates staging portfolio metadata with the public https origin', async () => {
    process.env.EXPO_PUBLIC_SITE_ORIGIN =
      'https://quizzical-hofstadter.108-175-12-95.plesk.page';

    const response = await GET(
      new Request('http://quizzical-hofstadter.108-175-12-95.plesk.page/api/portfolio/quantum'),
      { id: 'quantum' }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.portfolio.api.baseUrl).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1'
    );
    expect(body.data.registryEntry.portfolioUrl).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1/portfolio.json'
    );
  });
});
