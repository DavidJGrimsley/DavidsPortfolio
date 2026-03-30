export type QuantumKeyRecord = {
  id: string;
  label: string;
  maskedKey: string;
  createdAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  status: 'active' | 'revoked';
};

export type QuantumKeyMutationResult = {
  key: QuantumKeyRecord | null;
  rawKey: string | null;
  message?: string;
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

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
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

async function parseResponse(response: Response) {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  return readJsonOrText(rawText);
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

async function requestQuantumApi(
  baseUrl: string,
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : null),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new QuantumApiError(
      getErrorMessage(payload, `Request failed with HTTP ${response.status}.`),
      response.status,
      payload
    );
  }

  return payload;
}

function extractCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return [];
  }

  const directArray = pickNestedArray(objectPayload, 'keys', 'items', 'results', 'data');
  if (directArray.length > 0) {
    return directArray;
  }

  const nestedData = asObject(objectPayload.data);
  const nestedArray = pickNestedArray(nestedData, 'keys', 'items', 'results');

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
  const normalizedStatus = revokedAt || statusValue === 'revoked' ? 'revoked' : 'active';

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

export async function listQuantumKeys(baseUrl: string, accessToken: string) {
  const payload = await requestQuantumApi(baseUrl, accessToken, '/v1/keys', {
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
  const payload = await requestQuantumApi(baseUrl, accessToken, '/v1/keys', {
    method: 'POST',
    body: JSON.stringify(input.name ? { name: input.name } : {}),
  });

  return normalizeMutationResult(payload);
}

export async function revokeQuantumKey(baseUrl: string, accessToken: string, keyId: string) {
  const payload = await requestQuantumApi(
    baseUrl,
    accessToken,
    `/v1/keys/${encodeURIComponent(keyId)}/revoke`,
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
    `/v1/keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: 'POST',
    }
  );

  return normalizeMutationResult(payload);
}
