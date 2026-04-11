import type {
  QuantumGatewayProjectInput,
  QuantumGatewayProjectMutationResult,
  QuantumGatewayProjectRecord,
  QuantumGatewayProjectStatus,
  QuantumGatewayProjectsLoadResult,
  QuantumGatewayPublishableKeyInput,
  QuantumGatewayPublishableKeyMutationResult,
  QuantumGatewayPublishableKeyRecord,
  QuantumGatewayRuntimeSessionResult,
} from '@/types/quantum-gateway';

type JsonObject = Record<string, unknown>;

export class QuantumGatewayApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'QuantumGatewayApiError';
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

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
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

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function pickString(source: JsonObject | null, ...keys: string[]) {
  if (!source) return null;

  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }

  return null;
}

function pickNumber(source: JsonObject | null, fallback: number, ...keys: string[]) {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];
    const parsed = asNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function pickBoolean(source: JsonObject | null, ...keys: string[]) {
  if (!source) return null;

  for (const key of keys) {
    const value = asBoolean(source[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function pickObject(source: JsonObject | null, ...keys: string[]) {
  if (!source) return null;

  for (const key of keys) {
    const value = asObject(source[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function pickArray(source: JsonObject | null, ...keys: string[]) {
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

async function requestQuantumGateway(
  baseUrl: string,
  path: string,
  init?: RequestInit & { accessToken?: string }
) {
  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new QuantumGatewayApiError(
      getErrorMessage(payload, `Request failed with HTTP ${response.status}.`),
      response.status,
      payload
    );
  }

  return payload;
}

function joinUrl(baseUrl: string, path: string) {
  const trimmedPath = path.trim();
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  const baseMatch = normalizedBase.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);

  if (!baseMatch) {
    return `${normalizedBase}${normalizedPath}`;
  }

  const origin = baseMatch[1];
  const basePath = baseMatch[2] ?? '';

  if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
    return `${origin}${normalizedPath}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function normalizeStatus(value: string | null): QuantumGatewayProjectStatus {
  if (value === 'paused' || value === 'archived') {
    return value;
  }

  return 'active';
}

function normalizeProjectRecord(input: unknown): QuantumGatewayProjectRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const projectSlug = pickString(record, 'project_slug', 'projectSlug', 'slug');
  const displayName = pickString(record, 'display_name', 'displayName', 'name') ?? projectSlug;
  const endpointPathPrefix = pickString(record, 'endpoint_path_prefix', 'endpointPathPrefix');

  if (!projectSlug || !displayName || !endpointPathPrefix) {
    return null;
  }

  return {
    id: pickString(record, 'id', 'project_id', 'projectId') ?? projectSlug,
    ownerUserId: pickString(record, 'owner_user_id', 'ownerUserId') ?? 'unknown',
    projectSlug,
    displayName,
    status: normalizeStatus(pickString(record, 'status', 'state')),
    endpointPathPrefix,
    defaultApiKeyId: pickString(record, 'default_api_key_id', 'defaultApiKeyId'),
    defaultIbmCredentialProfileId: pickString(
      record,
      'default_ibm_credential_profile_id',
      'defaultIbmCredentialProfileId'
    ),
    routeAllowlist: asStringArray(record.route_allowlist ?? record.routeAllowlist),
    defaultRateLimitPerMinute: pickNumber(
      record,
      120,
      'default_rate_limit_per_minute',
      'defaultRateLimitPerMinute'
    ),
    dailyRequestQuota: pickNumber(record, 100000, 'daily_request_quota', 'dailyRequestQuota'),
    allowedOrigins: asStringArray(record.allowed_origins ?? record.allowedOrigins),
    createdAt: pickString(record, 'created_at', 'createdAt'),
    updatedAt: pickString(record, 'updated_at', 'updatedAt'),
  };
}

function normalizeProjectPayload(payload: unknown): QuantumGatewayProjectRecord | null {
  const objectPayload = asObject(payload);
  const nestedProject =
    pickObject(objectPayload, 'project', 'item', 'data') ?? objectPayload;

  return normalizeProjectRecord(nestedProject);
}

function normalizePublishableKeyStatus(value: string | null) {
  if (value === 'revoked' || value === 'rotated') {
    return value;
  }

  return 'active';
}

function normalizePublishableKeyRecord(
  input: unknown
): QuantumGatewayPublishableKeyRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const keyId = pickString(record, 'key_id', 'keyId', 'id', 'client_key_id', 'clientKeyId');
  if (!keyId) {
    return null;
  }

  const maskedKey =
    pickString(record, 'masked_key', 'maskedKey', 'key_preview', 'keyPreview') ??
    'Hidden until created';

  return {
    keyId,
    projectSlug: pickString(record, 'project_slug', 'projectSlug'),
    label:
      pickString(record, 'label', 'name', 'display_name', 'displayName') ??
      `Client key ${keyId.slice(0, 6)}`,
    maskedKey,
    status: normalizePublishableKeyStatus(pickString(record, 'status', 'state')),
    createdAt: pickString(record, 'created_at', 'createdAt'),
    lastUsedAt: pickString(record, 'last_used_at', 'lastUsedAt'),
    revokedAt: pickString(record, 'revoked_at', 'revokedAt'),
    expiresAt: pickString(record, 'expires_at', 'expiresAt'),
  };
}

function normalizePublishableKeyPayload(
  payload: unknown
): QuantumGatewayPublishableKeyMutationResult {
  const objectPayload = asObject(payload);
  const nestedKey =
    pickObject(objectPayload, 'key', 'previous_key', 'previousKey', 'new_key', 'newKey') ??
    objectPayload;

  const previousKey = normalizePublishableKeyRecord(
    pickObject(objectPayload, 'previous_key', 'previousKey')
  );
  const newKey = normalizePublishableKeyRecord(pickObject(objectPayload, 'new_key', 'newKey'));
  const primaryKey = normalizePublishableKeyRecord(
    pickObject(objectPayload, 'key', 'item', 'data') ?? nestedKey
  );

  return {
    key: primaryKey ?? newKey ?? previousKey,
    previousKey: previousKey ?? undefined,
    newKey: newKey ?? undefined,
    rawKey:
      pickString(
        objectPayload,
        'raw_key',
        'rawKey',
        'secret',
        'token',
        'publishable_key',
        'publishableKey'
      ) ?? pickString(nestedKey, 'raw_key', 'rawKey', 'secret', 'token'),
    secretVisibleOnce: pickBoolean(
      objectPayload,
      'secret_visible_once',
      'secretVisibleOnce',
      'visible_once',
      'visibleOnce'
    ) ?? undefined,
    message: pickString(objectPayload, 'message', 'detail') ?? undefined,
  };
}

function normalizeRuntimeSessionPayload(payload: unknown): QuantumGatewayRuntimeSessionResult {
  const objectPayload = asObject(payload);

  return {
    token:
      pickString(objectPayload, 'token', 'runtime_token', 'runtimeToken') ?? null,
    expiresAt: pickString(objectPayload, 'expires_at', 'expiresAt') ?? undefined,
    projectId: pickString(objectPayload, 'project_id', 'projectId') ?? undefined,
    message: pickString(objectPayload, 'message', 'detail') ?? undefined,
  };
}

function sanitizeProjectInput(input: QuantumGatewayProjectInput) {
  return {
    project_slug: input.projectSlug.trim(),
    display_name: input.displayName.trim(),
    status: input.status,
    endpoint_path_prefix: input.endpointPathPrefix.trim(),
    default_api_key_id: input.defaultApiKeyId?.trim() || null,
    default_ibm_credential_profile_id: input.defaultIbmCredentialProfileId?.trim() || null,
    route_allowlist: input.routeAllowlist.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    default_rate_limit_per_minute: input.defaultRateLimitPerMinute,
    daily_request_quota: input.dailyRequestQuota,
    allowed_origins: input.allowedOrigins.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
  };
}

function sanitizePublishableKeyInput(input: QuantumGatewayPublishableKeyInput) {
  return {
    name: input.label.trim(),
  };
}

function errorIncludes(error: string, ...needles: string[]) {
  const normalizedError = error.toLowerCase();
  return needles.some((needle) => normalizedError.includes(needle.toLowerCase()));
}

export function toQuantumGatewayUserMessage(error: unknown) {
  if (!(error instanceof QuantumGatewayApiError)) {
    return error instanceof Error ? error.message : 'Unable to complete the gateway request.';
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
    errorIncludes(joinedDetails, 'duplicate', 'already exists', 'unique', 'slug')
  ) {
    return 'A gateway project with that slug already exists. Choose a different slug.';
  }

  if (
    error.status === 401 ||
    error.status === 403 ||
    errorIncludes(joinedDetails, 'jwt', 'expired', 'not authenticated', 'authentication required')
  ) {
    return 'Your Identerest session is no longer valid. Sign in again and retry.';
  }

  if (error.status === 404 || errorIncludes(joinedDetails, 'not found')) {
    return 'That gateway project was not found.';
  }

  if (error.status === 400 || errorIncludes(joinedDetails, 'validation', 'invalid')) {
    return 'One or more gateway fields are invalid. Check the project slug, paths, and limits.';
  }

  return error.message;
}

export async function loadQuantumGatewayProjects(
  baseUrl: string,
  accessToken?: string | null
): Promise<QuantumGatewayProjectsLoadResult> {
  if (!accessToken) {
    return {
      source: 'static',
      projects: [],
      requiresAuth: true,
      message: 'Sign in with an Identerest account to load gateway projects.',
    };
  }

  try {
    const payload = await requestQuantumGateway(baseUrl, '/projects', {
      method: 'GET',
      accessToken,
    });

    const projectPayload = asObject(payload);
    const projects = pickArray(projectPayload, 'projects', 'items', 'results', 'data')
      .map((item) => normalizeProjectRecord(item))
      .filter((item): item is QuantumGatewayProjectRecord => item !== null);

    return {
      source: 'gateway',
      projects,
      requiresAuth: false,
    };
  } catch (error) {
    return {
      source: 'static',
      projects: [],
      requiresAuth:
        error instanceof QuantumGatewayApiError ? error.status === 401 || error.status === 403 : false,
      message:
        error instanceof Error ? error.message : 'Unable to load gateway projects right now.',
    };
  }
}

export async function saveQuantumGatewayProject(
  baseUrl: string,
  accessToken: string,
  input: QuantumGatewayProjectInput
): Promise<QuantumGatewayProjectMutationResult> {
  const payload = await requestQuantumGateway(baseUrl, '/projects', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(sanitizeProjectInput(input)),
  });

  return {
    project: normalizeProjectPayload(payload),
    message: pickString(asObject(payload), 'message', 'detail') ?? undefined,
  };
}

export async function updateQuantumGatewayProject(
  baseUrl: string,
  accessToken: string,
  projectSlug: string,
  input: QuantumGatewayProjectInput
): Promise<QuantumGatewayProjectMutationResult> {
  const payload = await requestQuantumGateway(
    baseUrl,
    `/projects/${encodeURIComponent(projectSlug)}`,
    {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(sanitizeProjectInput(input)),
    }
  );

  return {
    project: normalizeProjectPayload(payload),
    message: pickString(asObject(payload), 'message', 'detail') ?? undefined,
  };
}

export async function listQuantumGatewayPublishableKeys(
  baseUrl: string,
  accessToken: string,
  projectSlug: string
): Promise<QuantumGatewayPublishableKeyRecord[]> {
  const payload = await requestQuantumGateway(
    baseUrl,
    `/projects/${encodeURIComponent(projectSlug)}/publishable-keys`,
    {
      method: 'GET',
      accessToken,
    }
  );

  const objectPayload = asObject(payload);
  return pickArray(objectPayload, 'keys', 'items', 'results', 'data')
    .map((item) => normalizePublishableKeyRecord(item))
    .filter((item): item is QuantumGatewayPublishableKeyRecord => item !== null);
}

export async function createQuantumGatewayPublishableKey(
  baseUrl: string,
  accessToken: string,
  projectSlug: string,
  input: QuantumGatewayPublishableKeyInput
): Promise<QuantumGatewayPublishableKeyMutationResult> {
  const payload = await requestQuantumGateway(
    baseUrl,
    `/projects/${encodeURIComponent(projectSlug)}/publishable-keys`,
    {
      method: 'POST',
      accessToken,
      body: JSON.stringify(sanitizePublishableKeyInput(input)),
    }
  );

  return normalizePublishableKeyPayload(payload);
}

export async function rotateQuantumGatewayPublishableKey(
  baseUrl: string,
  accessToken: string,
  projectSlug: string,
  keyId: string
): Promise<QuantumGatewayPublishableKeyMutationResult> {
  const payload = await requestQuantumGateway(
    baseUrl,
    `/projects/${encodeURIComponent(projectSlug)}/publishable-keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: 'POST',
      accessToken,
    }
  );

  return normalizePublishableKeyPayload(payload);
}

export async function revokeQuantumGatewayPublishableKey(
  baseUrl: string,
  accessToken: string,
  projectSlug: string,
  keyId: string
): Promise<QuantumGatewayPublishableKeyMutationResult> {
  const payload = await requestQuantumGateway(
    baseUrl,
    `/projects/${encodeURIComponent(projectSlug)}/publishable-keys/${encodeURIComponent(keyId)}/revoke`,
    {
      method: 'POST',
      accessToken,
    }
  );

  return {
    key: normalizePublishableKeyRecord(asObject(payload)?.key ?? payload),
    rawKey: null,
    message: pickString(asObject(payload), 'message', 'detail') ?? undefined,
  };
}

export async function mintGatewayRuntimeSession(
  baseUrl: string,
  publishableKey: string
): Promise<QuantumGatewayRuntimeSessionResult> {
  const payload = await requestQuantumGateway(baseUrl, '/runtime-sessions', {
    method: 'POST',
    headers: {
      'X-Gateway-Publishable-Key': publishableKey,
    },
  });

  return normalizeRuntimeSessionPayload(payload);
}
