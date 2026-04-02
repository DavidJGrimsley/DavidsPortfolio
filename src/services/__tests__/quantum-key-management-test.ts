import {
  QuantumApiError,
  createIbmProfile,
  createQuantumKey,
  deleteIbmProfile,
  deleteRevokedQuantumKeys,
  listIbmProfiles,
  listQuantumKeys,
  rotateQuantumKey,
  toIbmProfileUserMessage,
  updateIbmProfile,
  verifyIbmProfile,
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
  const baseUrl = 'https://example.com/v1';
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

    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/keys`, {
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

  it('normalizes ibm profile list payloads', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          profiles: [
            {
              profile_id: ' profile-1 ',
              owner_user_id: 'user-1',
              profile_name: ' IBM Open ',
              instance: 'crn:v1:test',
              channel: 'ibm_quantum_platform',
              masked_token: 'tok_****1234',
              is_default: true,
              verification_status: 'verified',
              last_verified_at: '2026-04-01T11:00:00.000Z',
              created_at: '2026-03-29T11:00:00.000Z',
              updated_at: '2026-04-01T11:00:00.000Z',
            },
            {
              profile_name: 'missing-id',
            },
          ],
        })
      )
    );

    await expect(listIbmProfiles(baseUrl, accessToken)).resolves.toEqual([
      {
        profileId: 'profile-1',
        ownerUserId: 'user-1',
        profileName: 'IBM Open',
        instance: 'crn:v1:test',
        channel: 'ibm_quantum_platform',
        maskedToken: 'tok_****1234',
        isDefault: true,
        verificationStatus: 'verified',
        lastVerifiedAt: '2026-04-01T11:00:00.000Z',
        createdAt: '2026-03-29T11:00:00.000Z',
        updatedAt: '2026-04-01T11:00:00.000Z',
      },
    ]);
  });

  it('handles ibm profile create, update, verify, and delete calls', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            profile: {
              profile_id: 'profile-2',
              owner_user_id: 'user-1',
              profile_name: 'IBM Team',
              instance: 'crn:v1:team',
              channel: 'ibm_cloud',
              masked_token: 'tok_****4321',
              is_default: false,
              verification_status: 'unverified',
              created_at: '2026-04-01T11:00:00.000Z',
              updated_at: '2026-04-01T11:00:00.000Z',
            },
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            profile_id: 'profile-2',
            owner_user_id: 'user-1',
            profile_name: 'IBM Team Updated',
            instance: 'crn:v1:team-updated',
            channel: 'ibm_quantum_platform',
            masked_token: 'tok_****4321',
            is_default: true,
            verification_status: 'verified',
            last_verified_at: '2026-04-02T11:00:00.000Z',
            created_at: '2026-04-01T11:00:00.000Z',
            updated_at: '2026-04-02T11:00:00.000Z',
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            profile: {
              profile_id: 'profile-2',
              owner_user_id: 'user-1',
              profile_name: 'IBM Team Updated',
              instance: 'crn:v1:team-updated',
              channel: 'ibm_quantum_platform',
              masked_token: 'tok_****4321',
              is_default: true,
              verification_status: 'verified',
              last_verified_at: '2026-04-02T11:00:00.000Z',
              created_at: '2026-04-01T11:00:00.000Z',
              updated_at: '2026-04-02T11:00:00.000Z',
            },
            verified: true,
          })
        )
      )
      .mockResolvedValueOnce(createMockResponse(JSON.stringify({ deleted: true })));

    await expect(
      createIbmProfile(baseUrl, accessToken, {
        profileName: 'IBM Team',
        token: 'raw-token',
        instance: 'crn:v1:team',
        channel: 'ibm_cloud',
      })
    ).resolves.toMatchObject({
      profileId: 'profile-2',
      profileName: 'IBM Team',
      channel: 'ibm_cloud',
    });

    await expect(
      updateIbmProfile(baseUrl, accessToken, 'profile-2', {
        profileName: 'IBM Team Updated',
        instance: 'crn:v1:team-updated',
        channel: 'ibm_quantum_platform',
        isDefault: true,
      })
    ).resolves.toMatchObject({
      profileId: 'profile-2',
      profileName: 'IBM Team Updated',
      isDefault: true,
    });

    await expect(verifyIbmProfile(baseUrl, accessToken, 'profile-2')).resolves.toMatchObject({
      profileId: 'profile-2',
      verificationStatus: 'verified',
    });

    await expect(deleteIbmProfile(baseUrl, accessToken, 'profile-2')).resolves.toBeUndefined();
  });

  it('maps ibm profile api errors to user-facing messages', () => {
    const duplicate = new QuantumApiError('duplicate key value violates unique constraint', 409, {
      detail: 'duplicate profile_name',
    });
    const invalid = new QuantumApiError('credentials invalid', 400, {
      detail: 'invalid token',
    });
    const encryption = new QuantumApiError('kms not configured', 500, {
      detail: 'encryption key missing',
    });

    expect(toIbmProfileUserMessage(duplicate)).toBe(
      'A profile with that name already exists. Choose a different profile name.'
    );
    expect(toIbmProfileUserMessage(invalid)).toBe(
      'IBM credentials could not be verified. Check token, instance/CRN, and channel.'
    );
    expect(toIbmProfileUserMessage(encryption)).toBe(
      'Server encryption is not configured yet. Please try again later or contact support.'
    );
  });
});
