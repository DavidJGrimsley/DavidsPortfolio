describe('runtime config', () => {
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

  function loadRuntimeConfig() {
    return jest.requireActual('../runtime-config') as typeof import('../runtime-config');
  }

  it('prefers server runtime config over build-time env', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        __DJS_RUNTIME_CONFIG__: {
          EXPO_PUBLIC_SITE_ORIGIN: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
        },
      },
    });

    const runtimeConfig = loadRuntimeConfig();

    expect(runtimeConfig.readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SITE_ORIGIN')).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    );
  });

  it('falls back to build-time env when no runtime config is present', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://davidjgrimsley.com';
    delete (globalThis as { window?: unknown }).window;

    const runtimeConfig = loadRuntimeConfig();

    expect(runtimeConfig.readTrimmedPublicRuntimeConfigValue('EXPO_PUBLIC_SITE_ORIGIN')).toBe(
      'https://davidjgrimsley.com',
    );
  });
});
