describe('site origin', () => {
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

  function loadSiteOrigin() {
    return jest.requireActual('../site-origin') as typeof import('../site-origin');
  }

  function setWindowOrigin(origin: string) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          origin,
        },
      },
    });
  }

  it('prefers the configured site origin when present', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://quizzical-hofstadter.108-175-12-95.plesk.page/';

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveSiteOrigin()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    );
  });

  it('keeps the configured site origin for non-local browser origins', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://quizzical-hofstadter.108-175-12-95.plesk.page';
    setWindowOrigin('https://davidjgrimsley.com');

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveBrowserSiteOrigin()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    );
  });

  it('prefers the hosted runtime origin when a loopback env leaks into a hosted build', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveBrowserSiteOrigin()).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page',
    );
  });

  it('prefers the current loopback origin for local web testing', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'https://davidjgrimsley.com';
    setWindowOrigin('http://localhost:3000');

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveBrowserSiteOrigin()).toBe('http://localhost:3000');
  });

  it('falls back to the current browser origin when env is missing', () => {
    delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    setWindowOrigin('https://preview.example.com');

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveSiteOrigin()).toBe('https://preview.example.com');
    expect(siteOrigin.resolveBrowserSiteOrigin()).toBe('https://preview.example.com');
  });

  it('uses the production fallback when no explicit origin is available', () => {
    delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;

    const siteOrigin = loadSiteOrigin();

    expect(siteOrigin.resolveSiteOrigin()).toBe('https://davidjgrimsley.com');
    expect(siteOrigin.resolveBrowserSiteOrigin()).toBe('https://davidjgrimsley.com');
  });

  it('throws on invalid configured site origins', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = 'not-a-url';

    const siteOrigin = loadSiteOrigin();

    expect(() => siteOrigin.resolveSiteOrigin()).toThrow(
      'EXPO_PUBLIC_SITE_ORIGIN must be a valid absolute URL.',
    );
  });
});
