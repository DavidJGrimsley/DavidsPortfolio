describe('supabase browser auth redirect', () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalSiteOrigin = mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalSiteOrigin === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    } else {
      mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = originalSiteOrigin;
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

  it('uses the configured hosted origin for OAuth redirects', () => {
    // Hosted deployments serve EXPO_PUBLIC_SITE_ORIGIN through server.js runtime
    // config, so OAuth redirects use the environment-specific origin contract.
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN =
      'https://quizzical-hofstadter.108-175-12-95.plesk.page';
    setWindowOrigin('https://davidjgrimsley.com');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum',
    );
  });

  it('ignores a loopback env origin when the browser is on a hosted domain', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum',
    );
  });

  it('uses server runtime config for hosted GitHub OAuth redirects', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page', {
      EXPO_PUBLIC_SITE_ORIGIN: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    });

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum',
    );
  });

  it('keeps localhost during local web testing', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://davidjgrimsley.com';
    setWindowOrigin('http://localhost:3000');

    const supabaseBrowser = loadSupabaseBrowser();

    expect(supabaseBrowser.getQuantumAuthRedirectUrl()).toBe(
      'http://localhost:3000/public-facing/api/quantum',
    );
  });
});
