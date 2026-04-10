import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';
import type {
  CreateQuantumGatewayProjectInput,
  QuantumGatewayProjectRecord,
  QuantumGatewayProjectStatus,
  QuantumGatewayProjectsLoadResult,
  UpdateQuantumGatewayProjectInput,
} from '@/types/quantum-gateway';

type JsonObject = Record<string, unknown>;

const PROJECT_SELECT_COLUMNS =
  'id, owner_user_id, project_slug, display_name, status, endpoint_path_prefix, default_api_key_id, default_ibm_credential_profile_id, route_allowlist, default_rate_limit_per_minute, daily_request_quota, allowed_origins, created_at, updated_at';

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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function normalizeStatus(value: string | null): QuantumGatewayProjectStatus {
  if (value === 'paused' || value === 'archived') {
    return value;
  }

  return 'active';
}

function sanitizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeEndpointPathPrefix(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Endpoint path prefix is required.');
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function mapCreateProjectError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return 'Unable to create gateway project right now.';
  }

  if (error.code === '23505') {
    return 'A gateway project with this slug already exists on your Identerest account.';
  }

  if (error.code === '42501') {
    return 'Gateway project create is blocked by database RLS policy. Apply the latest core-monorepo DB migrations, then try again.';
  }

  return error.message ?? 'Unable to create gateway project right now.';
}

function mapUpdateProjectError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return 'Unable to update gateway project right now.';
  }

  if (error.code === '23505') {
    return 'A gateway project with this slug already exists on your Identerest account.';
  }

  if (error.code === '42501') {
    return 'Gateway project update is blocked by database RLS policy. Apply the latest core-monorepo DB migrations, then try again.';
  }

  return error.message ?? 'Unable to update gateway project right now.';
}

function normalizeProject(input: unknown): QuantumGatewayProjectRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const ownerUserId = asString(record.owner_user_id);
  const projectSlug = asString(record.project_slug);
  const displayName =
    asString(record.display_name) ??
    asString(record.project_slug) ??
    asString(record.id);
  const endpointPathPrefix = asString(record.endpoint_path_prefix);

  if (!id || !ownerUserId || !projectSlug || !displayName || !endpointPathPrefix) {
    return null;
  }

  return {
    id,
    ownerUserId,
    projectSlug,
    displayName,
    status: normalizeStatus(asString(record.status)),
    endpointPathPrefix,
    defaultApiKeyId: asString(record.default_api_key_id),
    defaultIbmCredentialProfileId: asString(record.default_ibm_credential_profile_id),
    routeAllowlist: asStringArray(record.route_allowlist),
    defaultRateLimitPerMinute: asNumber(record.default_rate_limit_per_minute, 120),
    dailyRequestQuota: asNumber(record.daily_request_quota, 100000),
    allowedOrigins: asStringArray(record.allowed_origins),
    createdAt: asString(record.created_at),
    updatedAt: asString(record.updated_at),
  };
}

export async function loadQuantumGatewayProjects(): Promise<QuantumGatewayProjectsLoadResult> {
  if (!isSupabaseConfigured()) {
    return {
      source: 'static',
      projects: [],
      requiresAuth: false,
      message: getSupabaseConfigError() ?? 'Supabase environment variables are not configured.',
    };
  }

  const supabase = getSupabaseBrowserClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return {
      source: 'supabase',
      projects: [],
      requiresAuth: false,
      message: sessionError.message,
    };
  }

  if (!sessionData.session?.access_token) {
    return {
      source: 'supabase',
      projects: [],
      requiresAuth: true,
      message: 'Sign in with Identerest to load your live gateway projects.',
    };
  }

  const { data, error } = await supabase
    .from('quantum_gateway_projects')
    .select(PROJECT_SELECT_COLUMNS)
    .order('updated_at', { ascending: false });

  if (error) {
    return {
      source: 'supabase',
      projects: [],
      requiresAuth: false,
      message: error.message,
    };
  }

  const rows = Array.isArray(data) ? data : [];
  const projects = rows
    .map((row) => normalizeProject(row))
    .filter((row): row is QuantumGatewayProjectRecord => row !== null);

  return {
    source: 'supabase',
    projects,
    requiresAuth: false,
  };
}

export async function createQuantumGatewayProject(
  input: CreateQuantumGatewayProjectInput
): Promise<QuantumGatewayProjectRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigError() ?? 'Supabase environment variables are not configured.');
  }

  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const signedInUserId = sessionData.session?.user?.id ?? null;
  if (!sessionData.session?.access_token || !signedInUserId) {
    throw new Error('Sign in with Identerest to manage gateway projects.');
  }

  const ownerUserId = input.ownerUserId.trim();
  if (!ownerUserId || ownerUserId !== signedInUserId) {
    throw new Error('Signed-in Identerest account does not match project owner.');
  }

  const projectSlug = input.projectSlug.trim();
  const displayName = input.displayName.trim();
  const endpointPathPrefix = normalizeEndpointPathPrefix(input.endpointPathPrefix);

  if (!projectSlug) {
    throw new Error('Project slug is required.');
  }

  if (!displayName) {
    throw new Error('Display name is required.');
  }

  const insertPayload = {
    owner_user_id: ownerUserId,
    project_slug: projectSlug,
    display_name: displayName,
    endpoint_path_prefix: endpointPathPrefix,
    status: input.status ?? 'active',
    default_api_key_id: input.defaultApiKeyId ?? null,
    default_ibm_credential_profile_id: input.defaultIbmCredentialProfileId ?? null,
    route_allowlist: sanitizeStringArray(input.routeAllowlist),
    default_rate_limit_per_minute: input.defaultRateLimitPerMinute ?? 120,
    daily_request_quota: input.dailyRequestQuota ?? 100000,
    allowed_origins: sanitizeStringArray(input.allowedOrigins),
  };

  const { data, error } = await supabase
    .from('quantum_gateway_projects')
    .insert(insertPayload)
    .select(PROJECT_SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(mapCreateProjectError(error));
  }

  const project = normalizeProject(data);
  if (!project) {
    throw new Error('Gateway project was created, but returned data was invalid.');
  }

  return project;
}

export async function updateQuantumGatewayProject(
  input: UpdateQuantumGatewayProjectInput
): Promise<QuantumGatewayProjectRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigError() ?? 'Supabase environment variables are not configured.');
  }

  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const signedInUserId = sessionData.session?.user?.id ?? null;
  if (!sessionData.session?.access_token || !signedInUserId) {
    throw new Error('Sign in with Identerest to manage gateway projects.');
  }

  const projectId = input.id.trim();
  if (!projectId) {
    throw new Error('Project id is required for updates.');
  }

  const ownerUserId = input.ownerUserId.trim();
  if (!ownerUserId || ownerUserId !== signedInUserId) {
    throw new Error('Signed-in Identerest account does not match project owner.');
  }

  const projectSlug = input.projectSlug.trim();
  const displayName = input.displayName.trim();
  const endpointPathPrefix = normalizeEndpointPathPrefix(input.endpointPathPrefix);

  if (!projectSlug) {
    throw new Error('Project slug is required.');
  }

  if (!displayName) {
    throw new Error('Display name is required.');
  }

  const updatePayload = {
    project_slug: projectSlug,
    display_name: displayName,
    endpoint_path_prefix: endpointPathPrefix,
    status: input.status ?? 'active',
    default_api_key_id: input.defaultApiKeyId ?? null,
    default_ibm_credential_profile_id: input.defaultIbmCredentialProfileId ?? null,
    route_allowlist: sanitizeStringArray(input.routeAllowlist),
    default_rate_limit_per_minute: input.defaultRateLimitPerMinute ?? 120,
    daily_request_quota: input.dailyRequestQuota ?? 100000,
    allowed_origins: sanitizeStringArray(input.allowedOrigins),
  };

  const { data, error } = await supabase
    .from('quantum_gateway_projects')
    .update(updatePayload)
    .eq('id', projectId)
    .eq('owner_user_id', ownerUserId)
    .select(PROJECT_SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(mapUpdateProjectError(error));
  }

  const project = normalizeProject(data);
  if (!project) {
    throw new Error('Gateway project was updated, but returned data was invalid.');
  }

  return project;
}
