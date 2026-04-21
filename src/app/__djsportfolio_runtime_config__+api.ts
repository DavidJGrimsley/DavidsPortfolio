import { loadServerRuntimeEnv } from '@/server/runtime-env';

function assignIfString(
  config: Record<string, string>,
  key: string,
  value: string | undefined
) {
  if (typeof value === 'string') {
    config[key] = value;
  }
}

function buildPublicRuntimeConfig() {
  const config: Record<string, string> = {};

  assignIfString(
    config,
    'EXPO_PUBLIC_PUBLIC_FACING_DEBUG',
    process.env.EXPO_PUBLIC_PUBLIC_FACING_DEBUG
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_QUANTUM_API_BASE_URL',
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_QUANTUM_API_KEY',
    process.env.EXPO_PUBLIC_QUANTUM_API_KEY
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL',
    process.env.EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_SITE_ORIGIN',
    process.env.EXPO_PUBLIC_SITE_ORIGIN
  );
  assignIfString(config, 'EXPO_PUBLIC_SITE_URL', process.env.EXPO_PUBLIC_SITE_URL);
  assignIfString(
    config,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_SUPABASE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_KEY
  );
  assignIfString(
    config,
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );

  return config;
}

export function GET(request: Request) {
  loadServerRuntimeEnv(request);

  return new Response(
    `window.__DJS_RUNTIME_CONFIG__ = Object.freeze(${JSON.stringify(buildPublicRuntimeConfig())});\n`,
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    }
  );
}
