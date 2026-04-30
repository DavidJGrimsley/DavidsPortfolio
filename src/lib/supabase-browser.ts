import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { QUANTUM_AUTH_PATH } from '@/lib/quantum-api-config';
import { readTrimmedPublicRuntimeConfigValue } from '@/lib/runtime-config';
import { resolveBrowserSiteOrigin } from '@/lib/site-origin';

const isWeb = Platform.OS === 'web';

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

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(getSupabaseConfigError() ?? 'Supabase is not configured.');
  }

  const configKey = `${url}\n${anonKey}`;
  if (supabaseClient && supabaseClientConfigKey === configKey) {
    return supabaseClient;
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: isWeb,
      detectSessionInUrl: isWeb,
      flowType: 'pkce',
      persistSession: isWeb,
      storage: isWeb ? undefined : memoryStorage(),
    },
  });
  supabaseClientConfigKey = configKey;

  return supabaseClient;
}
