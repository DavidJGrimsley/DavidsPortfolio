const PUBLIC_RUNTIME_ENV_KEYS = [
  'EXPO_PUBLIC_PUBLIC_FACING_DEBUG',
  'EXPO_PUBLIC_QUANTUM_API_BASE_URL',
  'EXPO_PUBLIC_QUANTUM_API_KEY',
  'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL',
  'EXPO_PUBLIC_SITE_ORIGIN',
  'EXPO_PUBLIC_SITE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
] as const;

export type PublicRuntimeEnvKey = (typeof PUBLIC_RUNTIME_ENV_KEYS)[number];

type PublicRuntimeConfig = Partial<Record<PublicRuntimeEnvKey, string>>;

declare global {
  interface Window {
    __DJS_RUNTIME_CONFIG__?: PublicRuntimeConfig;
  }
}

function readBuildTimePublicRuntimeValue(key: PublicRuntimeEnvKey): string {
  switch (key) {
    case 'EXPO_PUBLIC_PUBLIC_FACING_DEBUG':
      return process.env.EXPO_PUBLIC_PUBLIC_FACING_DEBUG ?? '';
    case 'EXPO_PUBLIC_QUANTUM_API_BASE_URL':
      return process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL ?? '';
    case 'EXPO_PUBLIC_QUANTUM_API_KEY':
      return process.env.EXPO_PUBLIC_QUANTUM_API_KEY ?? '';
    case 'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL':
      return process.env.EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL ?? '';
    case 'EXPO_PUBLIC_SITE_ORIGIN':
      return process.env.EXPO_PUBLIC_SITE_ORIGIN ?? '';
    case 'EXPO_PUBLIC_SITE_URL':
      return process.env.EXPO_PUBLIC_SITE_URL ?? '';
    case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    case 'EXPO_PUBLIC_SUPABASE_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
    case 'EXPO_PUBLIC_SUPABASE_URL':
      return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    default:
      return '';
  }
}

function readWindowRuntimeConfig(): PublicRuntimeConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtimeConfig = window.__DJS_RUNTIME_CONFIG__;
  if (!runtimeConfig || typeof runtimeConfig !== 'object' || Array.isArray(runtimeConfig)) {
    return null;
  }

  return runtimeConfig;
}

export function readPublicRuntimeConfigValue(key: PublicRuntimeEnvKey): string {
  const runtimeConfig = readWindowRuntimeConfig();
  const runtimeValue = runtimeConfig?.[key];

  if (typeof runtimeValue === 'string') {
    return runtimeValue;
  }

  return readBuildTimePublicRuntimeValue(key);
}

export function readTrimmedPublicRuntimeConfigValue(key: PublicRuntimeEnvKey): string {
  return readPublicRuntimeConfigValue(key).trim();
}

export function getPublicRuntimeEnvKeys(): readonly PublicRuntimeEnvKey[] {
  return PUBLIC_RUNTIME_ENV_KEYS;
}
