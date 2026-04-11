import {
  createQuantumGatewayPublishableKey,
  loadQuantumGatewayProjects,
  mintGatewayRuntimeSession,
  revokeQuantumGatewayPublishableKey,
  rotateQuantumGatewayPublishableKey,
  saveQuantumGatewayProject,
} from '../quantum-gateway-projects';

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function createMockResponse(body: string, init?: Partial<Pick<MockResponse, 'ok' | 'status'>>) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    text: jest.fn().mockResolvedValue(body),
  } as MockResponse;
}

describe('quantum gateway projects', () => {
  const fetchMock = jest.fn();
  const baseUrl = 'https://example.com/public-facing/api/quantum-gateway/v1';
  const accessToken = 'identerest-access-token';

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('loads project rows from the projects collection payload', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          projects: [
            {
              id: 'project-1',
              owner_user_id: 'user-1',
              project_slug: 'echoes-of-light',
              display_name: 'Echoes of Light',
              status: 'active',
              endpoint_path_prefix: '/public-facing/api/quantum-gateway/v1',
              default_api_key_id: 'key-1',
              default_ibm_credential_profile_id: 'profile-1',
              route_allowlist: ['/v1/health', '/v1/gates/run'],
              default_rate_limit_per_minute: 150,
              daily_request_quota: 50000,
              allowed_origins: ['http://localhost:3000'],
              created_at: '2026-04-01T00:00:00.000Z',
              updated_at: '2026-04-10T00:00:00.000Z',
            },
          ],
        })
      )
    );

    await expect(loadQuantumGatewayProjects(baseUrl, accessToken)).resolves.toEqual({
      source: 'gateway',
      projects: [
        {
          id: 'project-1',
          ownerUserId: 'user-1',
          projectSlug: 'echoes-of-light',
          displayName: 'Echoes of Light',
          status: 'active',
          endpointPathPrefix: '/public-facing/api/quantum-gateway/v1',
          defaultApiKeyId: 'key-1',
          defaultIbmCredentialProfileId: 'profile-1',
          routeAllowlist: ['/v1/health', '/v1/gates/run'],
          defaultRateLimitPerMinute: 150,
          dailyRequestQuota: 50000,
          allowedOrigins: ['http://localhost:3000'],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z',
        },
      ],
      requiresAuth: false,
    });
  });

  it('sends project payloads and normalizes save responses', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          project: {
            id: 'project-2',
            owner_user_id: 'user-1',
            project_slug: 'echoes-of-light',
            display_name: 'Echoes of Light',
            status: 'paused',
            endpoint_path_prefix: '/public-facing/api/quantum-gateway/v1',
            route_allowlist: ['/v1/health'],
            allowed_origins: ['https://example.com'],
          },
        })
      )
    );

    await expect(
      saveQuantumGatewayProject(baseUrl, accessToken, {
        projectSlug: 'echoes-of-light',
        displayName: 'Echoes of Light',
        status: 'paused',
        endpointPathPrefix: '/public-facing/api/quantum-gateway/v1',
        defaultApiKeyId: 'key-1',
        defaultIbmCredentialProfileId: 'profile-1',
        routeAllowlist: ['/v1/health'],
        defaultRateLimitPerMinute: 150,
        dailyRequestQuota: 50000,
        allowedOrigins: ['https://example.com'],
      })
    ).resolves.toEqual({
      project: {
        id: 'project-2',
        ownerUserId: 'user-1',
        projectSlug: 'echoes-of-light',
        displayName: 'Echoes of Light',
        status: 'paused',
        endpointPathPrefix: '/public-facing/api/quantum-gateway/v1',
        defaultApiKeyId: null,
        defaultIbmCredentialProfileId: null,
        routeAllowlist: ['/v1/health'],
        defaultRateLimitPerMinute: 120,
        dailyRequestQuota: 100000,
        allowedOrigins: ['https://example.com'],
        createdAt: null,
        updatedAt: null,
      },
      message: undefined,
    });
  });

  it('normalizes publishable key creation and runtime session payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            key: {
              key_id: 'client-1',
              label: 'Echoes of Light client',
              masked_key: 'gw_live_abc',
              status: 'active',
            },
            raw_key: 'gw_live_raw_secret',
            secret_visible_once: true,
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            token: 'runtime-token-123',
            expires_at: '2026-04-11T12:00:00.000Z',
            project_id: 'echoes-of-light',
          })
        )
      );

    await expect(
      createQuantumGatewayPublishableKey(baseUrl, accessToken, 'echoes-of-light', {
        label: 'Echoes of Light client',
      })
    ).resolves.toEqual({
      key: {
        keyId: 'client-1',
        projectSlug: null,
        label: 'Echoes of Light client',
        maskedKey: 'gw_live_abc',
        status: 'active',
        createdAt: null,
        lastUsedAt: null,
        revokedAt: null,
        expiresAt: null,
      },
      rawKey: 'gw_live_raw_secret',
      previousKey: undefined,
      newKey: undefined,
      secretVisibleOnce: true,
      message: undefined,
    });

    await expect(mintGatewayRuntimeSession(baseUrl, 'gw_live_raw_secret')).resolves.toEqual({
      token: 'runtime-token-123',
      expiresAt: '2026-04-11T12:00:00.000Z',
      projectId: 'echoes-of-light',
      message: undefined,
    });
  });

  it('normalizes rotate and revoke responses', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            previous_key: { key_id: 'client-1', label: 'Old label', masked_key: 'old-mask' },
            new_key: { key_id: 'client-1', label: 'New label', masked_key: 'new-mask' },
            raw_key: 'rotated-secret',
            secret_visible_once: true,
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            key: { key_id: 'client-1', label: 'New label', masked_key: 'new-mask' },
          })
        )
      );

    await expect(
      rotateQuantumGatewayPublishableKey(baseUrl, accessToken, 'echoes-of-light', 'client-1')
    ).resolves.toMatchObject({
      rawKey: 'rotated-secret',
      secretVisibleOnce: true,
      newKey: {
        keyId: 'client-1',
        label: 'New label',
        maskedKey: 'new-mask',
      },
    });

    await expect(
      revokeQuantumGatewayPublishableKey(baseUrl, accessToken, 'echoes-of-light', 'client-1')
    ).resolves.toMatchObject({
      key: {
        keyId: 'client-1',
        label: 'New label',
        maskedKey: 'new-mask',
      },
    });
  });
});
