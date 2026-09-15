import { QuantumApiError as SdkQuantumApiError } from '@mr.dj2u/quantum-api';
import { createQuantumBearerClient } from '@/lib/quantum-sdk-client';

export type QuantumKeyRecord = {
  id: string;
  label: string;
  maskedKey: string;
  createdAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  status: 'active' | 'revoked' | 'rotated';
};

export type QuantumKeyMutationResult = {
  key: QuantumKeyRecord | null;
  rawKey: string | null;
  message?: string;
};

export type QuantumRevokedBulkDeleteResult = {
  deletedCount: number;
};

export type IbmProfileChannel = 'ibm_quantum_platform' | 'ibm_cloud';
export type IbmVerificationStatus = 'unverified' | 'verified' | 'invalid';

export type IbmProfileRecord = {
  profileId: string;
  ownerUserId?: string | null;
  profileName: string;
  instance: string;
  channel: IbmProfileChannel;
  maskedToken: string;
  isDefault: boolean;
  verificationStatus: IbmVerificationStatus;
  lastVerifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type IbmProfileMutationInput = {
  profileName?: string;
  token?: string;
  instance?: string;
  channel?: IbmProfileChannel;
  isDefault?: boolean;
};

type JsonObject = Record<string, unknown>;

export class QuantumApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'QuantumApiError';
    this.status = status;
    this.details = details;
  }
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}

function asString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function pickString(source: JsonObject | null, ...keys: string[]) {
  if (!source) return null;

  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }

  return null;
}

function pickNestedArray(source: JsonObject | null, ...keys: string[]) {
  if (!source) return [];

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readJsonOrText(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return typeof payload === 'string' && payload.length > 0 ? payload : fallback;
  }

  return (
    pickString(objectPayload, 'detail', 'message', 'error', 'description') ??
    fallback
  );
}

function normalizeQuantumPath(path: string) {
  const trimmed = path.trim();
  const urlMatch = trimmed.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  const pathOnly = (urlMatch?.[1] ?? trimmed).trim();
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

  if (withLeadingSlash === '/v1') {
    return '/';
  }

  if (withLeadingSlash.startsWith('/v1/')) {
    return withLeadingSlash.slice(3);
  }

  return withLeadingSlash;
}

function parseRequestBody(body: BodyInit | null | undefined) {
  if (!body) {
    return undefined;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? readJsonOrText(trimmed) : undefined;
  }

  return body;
}

function toQuantumApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof QuantumApiError) {
    return error;
  }

  if (error instanceof SdkQuantumApiError) {
    const parsedBody = asObject(readJsonOrText(error.bodyText));
    const details = parsedBody ?? error.body ?? error.details ?? null;
    const fallbackHttpMessage = `Request failed with HTTP ${error.status}.`;

    return new QuantumApiError(
      getErrorMessage(details, fallbackHttpMessage),
      error.status,
      details
    );
  }

  if (error instanceof Error) {
    const status = /bearer token/i.test(error.message) ? 401 : 500;
    return new QuantumApiError(error.message || fallbackMessage, status, {
      message: error.message,
    });
  }

  return new QuantumApiError(fallbackMessage, 500, error);
}

async function requestQuantumApi(
  baseUrl: string,
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const client = createQuantumBearerClient(baseUrl, accessToken);
  const method = (init?.method ?? 'GET').toUpperCase();
  const normalizedPath = normalizeQuantumPath(path);
  const parsedBody = asObject(parseRequestBody(init?.body));
  const bearerOptions = {
    auth: 'bearer' as const,
    headers: {
      Accept: 'application/json',
    },
  };

  try {
    if (method === 'GET' && normalizedPath === '/keys') {
      return await client.listKeys(bearerOptions);
    }

    if (method === 'POST' && normalizedPath === '/keys') {
      return await client.createKey((parsedBody ?? {}) as { name?: string | null }, bearerOptions);
    }

    if (method === 'DELETE' && normalizedPath === '/keys/revoked') {
      return await client.deleteRevokedKeys(bearerOptions);
    }

    const keyRouteMatch = normalizedPath.match(/^\/keys\/([^/]+)(?:\/(revoke|rotate))?$/);
    if (keyRouteMatch) {
      const keyId = decodeURIComponent(keyRouteMatch[1] ?? '');
      const action = keyRouteMatch[2] ?? null;

      if (method === 'DELETE' && !action) {
        return await client.deleteKey(keyId, bearerOptions);
      }

      if (method === 'POST' && action === 'revoke') {
        return await client.revokeKey(keyId, bearerOptions);
      }

      if (method === 'POST' && action === 'rotate') {
        return await client.rotateKey(keyId, bearerOptions);
      }
    }

    if (method === 'GET' && normalizedPath === '/ibm/profiles') {
      return await client.listIbmProfiles(bearerOptions);
    }

    if (method === 'POST' && normalizedPath === '/ibm/profiles') {
      return await client.createIbmProfile((parsedBody ?? {}) as any, {
        ...bearerOptions,
      });
    }

    const ibmProfileRouteMatch = normalizedPath.match(/^\/ibm\/profiles\/([^/]+)(?:\/(verify))?$/);
    if (ibmProfileRouteMatch) {
      const profileId = decodeURIComponent(ibmProfileRouteMatch[1] ?? '');
      const action = ibmProfileRouteMatch[2] ?? null;

      if (method === 'PATCH' && !action) {
        return await client.updateIbmProfile(profileId, (parsedBody ?? {}) as any, {
          ...bearerOptions,
        });
      }

      if (method === 'DELETE' && !action) {
        return await client.deleteIbmProfile(profileId, bearerOptions);
      }

      if (method === 'POST' && action === 'verify') {
        return await client.verifyIbmProfile(profileId, bearerOptions);
      }
    }

    throw new QuantumApiError(
      `Unsupported Quantum bearer route: ${method} ${normalizedPath}.`,
      400,
      { method, path: normalizedPath }
    );
  } catch (error) {
    throw toQuantumApiError(error, 'Unable to complete the Quantum API bearer request.');
  }
}

function extractCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return [];
  }

  const directArray = pickNestedArray(
    objectPayload,
    'keys',
    'profiles',
    'backends',
    'items',
    'results',
    'data'
  );
  if (directArray.length > 0) {
    return directArray;
  }

  const nestedData = asObject(objectPayload.data);
  const nestedArray = pickNestedArray(nestedData, 'keys', 'profiles', 'backends', 'items', 'results');

  return nestedArray;
}

function maskKey(record: JsonObject | null) {
  if (!record) {
    return 'Hidden until created';
  }

  const explicitMask = pickString(
    record,
    'masked_key',
    'maskedKey',
    'key_preview',
    'keyPreview',
    'token_preview',
    'tokenPreview'
  );
  if (explicitMask) {
    return explicitMask;
  }

  const prefix = pickString(record, 'prefix', 'key_prefix', 'keyPrefix');
  const suffix = pickString(record, 'suffix', 'key_suffix', 'keySuffix');
  if (prefix || suffix) {
    return `${prefix ?? 'qk'}...${suffix ?? 'xxxx'}`;
  }

  const rawKey = pickString(record, 'raw_key', 'rawKey', 'api_key', 'apiKey', 'key', 'secret');
  if (rawKey && rawKey.length > 8) {
    return `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}`;
  }

  const id = pickString(record, 'id', 'key_id', 'keyId');
  return id ? `key_${id.slice(0, 6)}...` : 'Hidden until created';
}

function normalizeKeyRecord(input: unknown): QuantumKeyRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const id = pickString(record, 'id', 'key_id', 'keyId');
  if (!id) {
    return null;
  }

  const revokedAt = pickString(record, 'revoked_at', 'revokedAt');
  const statusValue = pickString(record, 'status', 'state');
  const normalizedStatus =
    statusValue === 'rotated'
      ? 'rotated'
      : revokedAt || statusValue === 'revoked'
        ? 'revoked'
        : 'active';

  return {
    id,
    label:
      pickString(record, 'name', 'label', 'display_name', 'displayName') ??
      `Key ${id.slice(0, 6)}`,
    maskedKey: maskKey(record),
    createdAt: pickString(record, 'created_at', 'createdAt'),
    lastUsedAt: pickString(record, 'last_used_at', 'lastUsedAt'),
    revokedAt,
    status: normalizedStatus,
  };
}

function normalizeMutationResult(payload: unknown): QuantumKeyMutationResult {
  const objectPayload = asObject(payload);
  const nestedKey =
    asObject(objectPayload?.key) ??
    asObject(objectPayload?.item) ??
    asObject(objectPayload?.data) ??
    objectPayload;

  return {
    key: normalizeKeyRecord(nestedKey),
    rawKey:
      pickString(
        objectPayload,
        'raw_key',
        'rawKey',
        'api_key',
        'apiKey',
        'secret',
        'token',
        'key'
      ) ?? pickString(nestedKey, 'raw_key', 'rawKey', 'api_key', 'apiKey', 'secret', 'token'),
    message: pickString(objectPayload, 'message', 'detail') ?? undefined,
  };
}

function normalizeIbmChannel(value: string | null): IbmProfileChannel {
  return value === 'ibm_cloud' ? 'ibm_cloud' : 'ibm_quantum_platform';
}

function normalizeVerificationStatus(value: string | null): IbmVerificationStatus {
  if (value === 'verified' || value === 'invalid') {
    return value;
  }
  return 'unverified';
}

function normalizeIbmProfileRecord(input: unknown): IbmProfileRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const profileId = pickString(record, 'profile_id', 'profileId', 'id');
  const profileName = pickString(record, 'profile_name', 'profileName', 'name');
  const instance = pickString(record, 'instance');

  if (!profileId || !profileName || !instance) {
    return null;
  }

  return {
    profileId,
    ownerUserId: pickString(record, 'owner_user_id', 'ownerUserId'),
    profileName,
    instance,
    channel: normalizeIbmChannel(pickString(record, 'channel')),
    maskedToken:
      pickString(record, 'masked_token', 'maskedToken', 'token_preview', 'tokenPreview') ??
      'Hidden until saved',
    isDefault: asBoolean(record.is_default ?? record.isDefault) ?? false,
    verificationStatus: normalizeVerificationStatus(
      pickString(record, 'verification_status', 'verificationStatus')
    ),
    lastVerifiedAt: pickString(record, 'last_verified_at', 'lastVerifiedAt'),
    createdAt: pickString(record, 'created_at', 'createdAt'),
    updatedAt: pickString(record, 'updated_at', 'updatedAt'),
  };
}

function normalizeIbmProfilePayload(payload: unknown): IbmProfileRecord | null {
  const objectPayload = asObject(payload);
  const nestedProfile =
    asObject(objectPayload?.profile) ??
    asObject(objectPayload?.item) ??
    asObject(objectPayload?.data) ??
    objectPayload;

  return normalizeIbmProfileRecord(nestedProfile);
}

function sanitizeIbmProfileMutationInput(input: IbmProfileMutationInput) {
  const body: Record<string, unknown> = {};

  if (typeof input.profileName === 'string' && input.profileName.trim().length > 0) {
    body.profile_name = input.profileName.trim();
  }
  if (typeof input.token === 'string' && input.token.trim().length > 0) {
    body.token = input.token.trim();
  }
  if (typeof input.instance === 'string' && input.instance.trim().length > 0) {
    body.instance = input.instance.trim();
  }
  if (input.channel) {
    body.channel = input.channel;
  }
  if (typeof input.isDefault === 'boolean') {
    body.is_default = input.isDefault;
  }

  return body;
}

function errorIncludes(error: string, ...needles: string[]) {
  const normalizedError = error.toLowerCase();
  return needles.some((needle) => normalizedError.includes(needle.toLowerCase()));
}

export function toIbmProfileUserMessage(error: unknown) {
  if (!(error instanceof QuantumApiError)) {
    return error instanceof Error ? error.message : 'Unable to complete the IBM profile request.';
  }

  const details = asObject(error.details);
  const joinedDetails = [
    error.message,
    pickString(details, 'detail', 'message', 'error', 'description'),
    typeof error.details === 'string' ? error.details : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim();

  if (
    error.status === 409 ||
    errorIncludes(joinedDetails, 'duplicate', 'already exists', 'profile_name', 'unique')
  ) {
    return 'A profile with that name already exists. Choose a different profile name.';
  }

  if (
    error.status === 401 ||
    error.status === 403 ||
    errorIncludes(
      joinedDetails,
      'access token',
      'jwt',
      'expired',
      'not authenticated',
      'authentication required'
    )
  ) {
    return 'Your session is no longer valid. Sign out and sign in again, then retry.';
  }

  if (
    error.status === 400 ||
    errorIncludes(joinedDetails, 'invalid credential', 'invalid token', 'unauthorized')
  ) {
    return 'IBM credentials could not be verified. Check token, instance/CRN, and channel.';
  }

  if (
    error.status >= 500 &&
    errorIncludes(joinedDetails, 'encrypt', 'cipher', 'kms', 'vault', 'key management')
  ) {
    return 'Server encryption is not configured yet. Please try again later or contact support.';
  }

  return error.message;
}

export async function listQuantumKeys(baseUrl: string, accessToken: string) {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/keys', {
    method: 'GET',
  });

  return extractCollection(payload)
    .map((item) => normalizeKeyRecord(item))
    .filter((item): item is QuantumKeyRecord => item !== null);
}

export async function createQuantumKey(
  baseUrl: string,
  accessToken: string,
  input: { name?: string }
) {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/keys', {
    method: 'POST',
    body: JSON.stringify(input.name ? { name: input.name } : {}),
  });

  return normalizeMutationResult(payload);
}

export async function revokeQuantumKey(baseUrl: string, accessToken: string, keyId: string) {
  const payload = await requestQuantumApi(
    baseUrl,
    accessToken,
    `/keys/${encodeURIComponent(keyId)}/revoke`,
    {
      method: 'POST',
    }
  );

  return normalizeMutationResult(payload);
}

export async function rotateQuantumKey(baseUrl: string, accessToken: string, keyId: string) {
  const payload = await requestQuantumApi(
    baseUrl,
    accessToken,
    `/keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: 'POST',
    }
  );

  return normalizeMutationResult(payload);
}

export async function deleteQuantumKey(baseUrl: string, accessToken: string, keyId: string) {
  await requestQuantumApi(baseUrl, accessToken, `/keys/${encodeURIComponent(keyId)}`, {
    method: 'DELETE',
  });
}

export async function deleteRevokedQuantumKeys(
  baseUrl: string,
  accessToken: string
): Promise<QuantumRevokedBulkDeleteResult> {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/keys/revoked', {
    method: 'DELETE',
  });
  const objectPayload = asObject(payload);
  const deletedCount = asNumber(objectPayload?.deleted_count ?? objectPayload?.deletedCount) ?? 0;
  return { deletedCount };
}

export async function listIbmProfiles(baseUrl: string, accessToken: string) {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/ibm/profiles', {
    method: 'GET',
  });

  return extractCollection(payload)
    .map((item) => normalizeIbmProfileRecord(item))
    .filter((item): item is IbmProfileRecord => item !== null);
}

export async function createIbmProfile(
  baseUrl: string,
  accessToken: string,
  input: IbmProfileMutationInput
) {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/ibm/profiles', {
    method: 'POST',
    body: JSON.stringify(sanitizeIbmProfileMutationInput(input)),
  });

  return normalizeIbmProfilePayload(payload);
}

export async function updateIbmProfile(
  baseUrl: string,
  accessToken: string,
  profileId: string,
  input: IbmProfileMutationInput
) {
  const payload = await requestQuantumApi(
    baseUrl,
    accessToken,
    `/ibm/profiles/${encodeURIComponent(profileId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(sanitizeIbmProfileMutationInput(input)),
    }
  );

  return normalizeIbmProfilePayload(payload);
}

export async function deleteIbmProfile(baseUrl: string, accessToken: string, profileId: string) {
  await requestQuantumApi(baseUrl, accessToken, `/ibm/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
  });
}

export async function verifyIbmProfile(baseUrl: string, accessToken: string, profileId: string) {
  const payload = await requestQuantumApi(
    baseUrl,
    accessToken,
    `/ibm/profiles/${encodeURIComponent(profileId)}/verify`,
    {
      method: 'POST',
    }
  );

  return normalizeIbmProfilePayload(payload);
}
