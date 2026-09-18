import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { QUANTUM_AUTH_PATH } from '@/lib/quantum-api-config';
import { readTrimmedPublicRuntimeConfigValue } from '@/lib/runtime-config';
import { resolveBrowserSiteOrigin } from '@/lib/site-origin';

const isWeb = Platform.OS === 'web';
type SupabaseAuthFlowType = 'implicit' | 'pkce';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStorage = (): StorageLike => {
  const storage = new Map<string, string>();

  return {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.delete(key);
    },
  };
};

let supabaseClient: SupabaseClient | null = null;
let supabaseClientConfigKey = '';

function getSupabaseUrl() {
  return readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_URL');
}

function getSupabaseAnonKey() {
  return (
    readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
    readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_KEY')
  );
}

function parseHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function readBrowserHostname() {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = String(window.location?.hostname ?? '').trim().toLowerCase();
  return hostname || parseHostname(String(window.location?.origin ?? ''));
}

function readConfiguredSiteHostname() {
  return (
    parseHostname(readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SITE_ORIGIN')) ||
    parseHostname(readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SITE_URL'))
  );
}

function isPleskTechnicalHostname(hostname: string) {
  return hostname.endsWith('.plesk.page');
}

function normalizeAuthFlowType(value: string): SupabaseAuthFlowType | null {
  const normalized = value.trim().toLowerCase();
  return normalized === 'implicit' || normalized === 'pkce' ? normalized : null;
}

function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return {
    anonKey,
    hasAnonKey: Boolean(readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_ANON_KEY')),
    hasLegacyKey: Boolean(readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_KEY')),
    url,
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseConfigError() {
  if (isSupabaseConfigured()) return null;
  const { url, anonKey, hasAnonKey, hasLegacyKey } = getSupabaseConfig();
  const missing: string[] = [];
  if (!url) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  const baseError =
    missing.length > 0
      ? `Missing ${missing.join(' and ')}.`
      : 'Supabase configuration is incomplete.';

  if (!hasAnonKey && hasLegacyKey) {
    return `${baseError} Found legacy EXPO_PUBLIC_SUPABASE_KEY. Rename it to EXPO_PUBLIC_SUPABASE_ANON_KEY.`;
  }

  return baseError;
}

export function getQuantumAuthRedirectUrl() {
  return new URL(QUANTUM_AUTH_PATH, resolveBrowserSiteOrigin()).toString();
}

export function getSupabaseAuthFlowType(): SupabaseAuthFlowType {
  const configuredFlow = normalizeAuthFlowType(
    readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SUPABASE_AUTH_FLOW')
  );
  if (configuredFlow) {
    return configuredFlow;
  }

  if (
    isPleskTechnicalHostname(readBrowserHostname()) ||
    isPleskTechnicalHostname(readConfiguredSiteHostname())
  ) {
    return 'implicit';
  }

  return 'pkce';
}

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(getSupabaseConfigError() ?? 'Supabase is not configured.');
  }

  const authFlowType = getSupabaseAuthFlowType();
  const configKey = `${url}\n${anonKey}\n${authFlowType}`;
  if (supabaseClient && supabaseClientConfigKey === configKey) {
    return supabaseClient;
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: isWeb,
      detectSessionInUrl: isWeb,
      flowType: authFlowType,
      persistSession: isWeb,
      storage: isWeb ? undefined : memoryStorage(),
    },
  });
  supabaseClientConfigKey = configKey;

  return supabaseClient;
}
