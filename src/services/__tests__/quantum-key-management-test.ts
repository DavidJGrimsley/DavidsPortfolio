import {
  QuantumApiError,
  createQuantumKey,
  deleteRevokedQuantumKeys,
  listQuantumKeys,
  rotateQuantumKey,
} from '../quantum-key-management';

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

describe('quantum key management', () => {
  const fetchMock = jest.fn();
  const baseUrl = 'https://example.com/public-facing/api/quantum';
  const accessToken = 'supabase-access-token';

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('normalizes key list payloads and filters invalid rows', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          data: {
            keys: [
              {
                key_id: ' key-001 ',
                display_name: ' Primary API Key ',
                masked_key: ' qk_live_abc ',
                created_at: '2026-03-01T10:00:00.000Z',
                last_used_at: '2026-03-30T10:00:00.000Z',
                status: 'revoked',
              },
              {
                id: 'key-002',
                name: 'Fallback Key',
                prefix: 'qk',
                suffix: '1234',
                state: 'rotated',
              },
              {
                id: 'key-003',
                apiKey: 'sk_live_1234567890',
              },
              {
                label: 'Missing id should be filtered out',
              },
            ],
          },
        })
      )
    );

    const keys = await listQuantumKeys(baseUrl, accessToken);

    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/v1/keys`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    });
    expect(keys).toEqual([
      {
        id: 'key-001',
        label: 'Primary API Key',
        maskedKey: 'qk_live_abc',
        createdAt: '2026-03-01T10:00:00.000Z',
        lastUsedAt: '2026-03-30T10:00:00.000Z',
        revokedAt: null,
        status: 'revoked',
      },
      {
        id: 'key-002',
        label: 'Fallback Key',
        maskedKey: 'qk...1234',
        createdAt: null,
        lastUsedAt: null,
        revokedAt: null,
        status: 'rotated',
      },
      {
        id: 'key-003',
        label: 'Key key-00',
        maskedKey: 'sk_liv...7890',
        createdAt: null,
        lastUsedAt: null,
        revokedAt: null,
        status: 'active',
      },
    ]);
  });

  it('normalizes mutation payloads from nested response shapes', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          key: {
            id: ' key-004 ',
            displayName: 'Generated Key',
            key: 'sk_live_abcdef123456',
          },
          token: 'one-time-secret',
          message: 'Created successfully',
        })
      )
    );

    const result = await createQuantumKey(baseUrl, accessToken, { name: 'Generated Key' });

    expect(result).toEqual({
      key: {
        id: 'key-004',
        label: 'Generated Key',
        maskedKey: 'sk_liv...3456',
        createdAt: null,
        lastUsedAt: null,
        revokedAt: null,
        status: 'active',
      },
      rawKey: 'one-time-secret',
      message: 'Created successfully',
    });
  });

  it('surfaces api errors with parsed detail payloads', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(JSON.stringify({ detail: 'Validation failed' }), {
        ok: false,
        status: 422,
      })
    );

    await expect(listQuantumKeys(baseUrl, accessToken)).rejects.toMatchObject({
      name: 'QuantumApiError',
      message: 'Validation failed',
      status: 422,
      details: { detail: 'Validation failed' },
    });
  });

  it('falls back to the http status message when the error body is empty', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse('', {
        ok: false,
        status: 503,
      })
    );

    await expect(rotateQuantumKey(baseUrl, accessToken, 'key-005')).rejects.toMatchObject({
      name: 'QuantumApiError',
      message: 'Request failed with HTTP 503.',
      status: 503,
      details: null,
    });
  });

  it('normalizes bulk delete responses with numeric strings', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(JSON.stringify({ deleted_count: '4' }), {
        ok: true,
        status: 200,
      })
    );

    await expect(deleteRevokedQuantumKeys(baseUrl, accessToken)).resolves.toEqual({
      deletedCount: 4,
    });
  });

  it('throws the custom error type for non-ok responses', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse('plain text error', {
        ok: false,
        status: 500,
      })
    );

    await expect(createQuantumKey(baseUrl, accessToken, {})).rejects.toBeInstanceOf(
      QuantumApiError
    );
  });
});
