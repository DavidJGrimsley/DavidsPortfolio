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

  function setWindowLocation(hostname: string, port: string) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          hostname,
          port,
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

  it('falls back to hosted quantum path for production builds when env is missing', () => {
    mutableEnv.NODE_ENV = 'production';
    delete mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1'
    );
    expect(config.QUANTUM_PORTFOLIO_URL).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/v1/portfolio.json'
    );
  });

  it('uses the env override and trims trailing slashes', () => {
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/api/quantum/';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe('https://example.com/api/quantum');
    expect(config.QUANTUM_PORTFOLIO_URL).toBe('https://example.com/api/quantum/portfolio.json');
  });

  it('does not rewrite env override to same-origin on localhost web runtime', () => {
    setWindowLocation('localhost', '3000');
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe(
      'https://example.com/public-facing/api/quantum/v1'
    );
  });

  it('resolves api-key and public endpoints to the configured base url', () => {
    mutableEnv.EXPO_PUBLIC_QUANTUM_API_BASE_URL =
      'https://example.com/public-facing/api/quantum/v1';

    const config = loadConfig();

    expect(config.resolveQuantumEndpointBaseUrl('api_key', true)).toBe(
      'https://example.com/public-facing/api/quantum/v1'
    );
    expect(config.resolveQuantumEndpointBaseUrl('public', true)).toBe(
      'https://example.com/public-facing/api/quantum/v1'
    );
    expect(config.resolveQuantumEndpointBaseUrl('api_key', false)).toBe(
      'https://example.com/public-facing/api/quantum/v1'
    );
  });
});
