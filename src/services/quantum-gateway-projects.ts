import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';
import type {
  QuantumGatewayProjectRecord,
  QuantumGatewayProjectStatus,
  QuantumGatewayProjectsLoadResult,
} from '@/types/quantum-gateway';

type JsonObject = Record<string, unknown>;

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
    .select(
      'id, owner_user_id, project_slug, display_name, status, endpoint_path_prefix, default_api_key_id, default_ibm_credential_profile_id, route_allowlist, default_rate_limit_per_minute, daily_request_quota, allowed_origins, created_at, updated_at'
    )
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
