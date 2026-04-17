import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { QUANTUM_AUTH_PATH } from '@/lib/quantum-api-config';
import { resolveBrowserSiteOrigin } from '@/lib/site-origin';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
const HAS_LEGACY_SUPABASE_KEY = Boolean(process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim());
const HAS_ANON_SUPABASE_KEY = Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim());
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

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseConfigError() {
  if (isSupabaseConfigured()) return null;
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  const baseError =
    missing.length > 0
      ? `Missing ${missing.join(' and ')}.`
      : 'Supabase configuration is incomplete.';

  if (!HAS_ANON_SUPABASE_KEY && HAS_LEGACY_SUPABASE_KEY) {
    return `${baseError} Found legacy EXPO_PUBLIC_SUPABASE_KEY. Rename it to EXPO_PUBLIC_SUPABASE_ANON_KEY.`;
  }

  return baseError;
}

export function getQuantumAuthRedirectUrl() {
  return new URL(QUANTUM_AUTH_PATH, resolveBrowserSiteOrigin()).toString();
}

export function getSupabaseBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(getSupabaseConfigError() ?? 'Supabase is not configured.');
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: isWeb,
      detectSessionInUrl: isWeb,
      flowType: 'pkce',
      persistSession: isWeb,
      storage: isWeb ? undefined : memoryStorage(),
    },
  });

  return supabaseClient;
}
