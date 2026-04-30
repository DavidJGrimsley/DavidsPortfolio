describe('quantum api config', () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalEnvValue = mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
  const originalNodeEnv = mutableEnv.NODE_ENV;
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
    } else {
      mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = originalEnvValue;
    }

    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
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

  function loadConfig() {
    return jest.requireActual('../quantum-api-config') as typeof import('../quantum-api-config');
  }

  function setWindowLocation(origin: string) {
    const parsed = new URL(origin);
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          origin: parsed.origin,
          hostname: parsed.hostname,
          port: parsed.port,
        },
      },
    });
  }

  it('falls back to the local /v1 base url when the env var is missing or blank', () => {
    mutableEnv.NODE_ENV = 'test';
    delete mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

    const withoutEnv = loadConfig();

    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = '   ';
    jest.resetModules();
    const withBlankEnv = loadConfig();

    expect(withoutEnv.QUANTUM_API_BASE_URL).toBe('http://127.0.0.1:8000/v1');
    expect(withoutEnv.QUANTUM_PORTFOLIO_URL).toBe(
      'http://127.0.0.1:8000/v1/portfolio.json'
    );
    expect(withBlankEnv.QUANTUM_API_BASE_URL).toBe('http://127.0.0.1:8000/v1');
  });

  it('fails fast in production builds when env base URL is missing', () => {
    mutableEnv.NODE_ENV = 'production';
    delete mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

    expect(() => loadConfig()).toThrow(
      'Missing EXPO_PUBLIC_QUANTUM_API_BASE_URL in production runtime. Set an explicit mounted Quantum API base URL.'
    );
  });

  it('uses the env override and trims trailing slashes', () => {
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/api/quantum/';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe('https://example.com/api/quantum');
    expect(config.QUANTUM_PORTFOLIO_URL).toBe('https://example.com/api/quantum/portfolio.json');
  });

  it('keeps the configured base constant stable on localhost web runtime', () => {
    setWindowLocation('http://localhost:3000');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe(
      'https://example.com/public-facing/api/quantum/v1'
    );
  });

  it('uses the same public-facing path on localhost:3000', () => {
    setWindowLocation('http://localhost:3000');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.resolveQuantumBrowserApiBaseUrl(config.QUANTUM_API_BASE_URL, true)).toBe(
      'http://localhost:3000/public-facing/api/quantum/v1'
    );
    expect(config.resolveQuantumEndpointBaseUrl('api_key', false)).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1'
    );
    expect(config.resolveQuantumEndpointBaseUrl('api_key', true)).toBe(
      'http://localhost:3000/public-facing/api/quantum/v1'
    );
  });

  it('uses the same public-facing path on Plesk staging hosts', () => {
    setWindowLocation('https://quizzical-hofstadter.108-175-12-95.plesk.page');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.resolveQuantumBrowserApiBaseUrl(config.QUANTUM_API_BASE_URL, true)).toBe(
      'https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum/v1'
    );
  });

  it('keeps the configured URL on localhost:8081 because the backend allows that origin', () => {
    setWindowLocation('http://localhost:8081');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.resolveQuantumBrowserApiBaseUrl(config.QUANTUM_API_BASE_URL, true)).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1'
    );
  });

  it('keeps the configured URL on production and non-web runtimes', () => {
    setWindowLocation('https://davidjgrimsley.com');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://davidjgrimsley.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.resolveQuantumBrowserApiBaseUrl(config.QUANTUM_API_BASE_URL, true)).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1'
    );
    expect(config.resolveQuantumBrowserApiBaseUrl(config.QUANTUM_API_BASE_URL, false)).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1'
    );
  });
});
