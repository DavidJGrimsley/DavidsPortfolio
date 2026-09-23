describe('supabase browser auth redirect', () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalSiteOrigin = mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
  const originalAuthFlow = mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW;
  const originalSupabaseUrl = mutableEnv.EXPO_PUBLIC_SUPABASE_URL;
  const originalSupabaseAnonKey = mutableEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalSiteOrigin === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    } else {
      mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = originalSiteOrigin;
    }

    if (originalAuthFlow === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW;
    } else {
      mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW = originalAuthFlow;
    }

    if (originalSupabaseUrl === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SUPABASE_URL;
    } else {
      mutableEnv.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    }

    if (originalSupabaseAnonKey === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      mutableEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
    }

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
    }

    jest.resetModules();
    jest.dontMock('@supabase/supabase-js');
  });

  function loadSupabaseBrowser() {
    return jest.requireActual('../supabase-browser') as typeof import('../supabase-browser');
  }

  function setWindowOrigin(
    origin: string,
    runtimeConfig?: Record<string, string>,
  ) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        __DJS_RUNTIME_CONFIG__: runtimeConfig,
        location: {
          origin,
        },
      },
    });
  }

  it('uses the current hosted browser origin for OAuth redirects', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN =
      'https://quizzical-hofstadter.108-175-12-95.plesk.page';
    setWindowOrigin('https://davidjgrimsley.com');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/auth',
    );
  });

  it('ignores a loopback env origin when the browser is on a hosted domain', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum/auth',
    );
  });

  it('uses server runtime config for hosted GitHub OAuth redirects', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page', {
      EXPO_PUBLIC_SITE_ORIGIN: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    });

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum/auth',
    );
  });

  it('keeps localhost during local web testing', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://davidjgrimsley.com';
    setWindowOrigin('http://localhost:3000');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'http://localhost:3000/public-facing/api/quantum/auth',
    );
  });

  it('uses implicit auth flow on Plesk staging because the technical-domain gate clears storage', () => {
    delete mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW;
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN =
      'https://quizzical-hofstadter.108-175-12-95.plesk.page';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getSupabaseAuthFlowType()).toBe('implicit');
  });

  it('keeps PKCE auth flow on production domains', () => {
    delete mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW;
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://davidjgrimsley.com';
    setWindowOrigin('https://davidjgrimsley.com');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getSupabaseAuthFlowType()).toBe('pkce');
  });

  it('lets runtime config override automatic auth flow detection', () => {
    delete mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW;
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page', {
      EXPO_PUBLIC_SUPABASE_AUTH_FLOW: 'pkce',
      EXPO_PUBLIC_SITE_ORIGIN: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    });

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getSupabaseAuthFlowType()).toBe('pkce');
  });

  it('reuses the callback client for dashboard default gets', () => {
    mutableEnv.EXPO_PUBLIC_SUPABASE_URL = 'https://auth.example.test';
    mutableEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mutableEnv.EXPO_PUBLIC_SUPABASE_AUTH_FLOW = 'pkce';
    setWindowOrigin('https://davidjgrimsley.com');

    const callbackClient = { auth: {} };
    const createClient = jest.fn(() => callbackClient);
    jest.doMock('@supabase/supabase-js', () => ({ createClient }));

    const supabaseBrowser = loadSupabaseBrowser();
    const client = supabaseBrowser.getSupabaseBrowserClient({
      detectSessionInUrl: false,
    });
    supabaseBrowser.reuseSupabaseBrowserClientForDefaultGets(client);

    expect(supabaseBrowser.getSupabaseBrowserClient()).toBe(callbackClient);
    expect(supabaseBrowser.getSupabaseBrowserClient()).toBe(callbackClient);
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
