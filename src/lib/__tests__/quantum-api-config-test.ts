describe('quantum api config', () => {
  const originalEnvValue = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = originalEnvValue;
    }

    jest.resetModules();
  });

  function loadConfig() {
    return jest.requireActual('../quantum-api-config') as typeof import('../quantum-api-config');
  }

  it('falls back to the local /v1 base url when the env var is missing or blank', () => {
    delete process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

    const withoutEnv = loadConfig();

    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = '   ';
    jest.resetModules();
    const withBlankEnv = loadConfig();

    expect(withoutEnv.QUANTUM_API_BASE_URL).toBe('http://127.0.0.1:8000/v1');
    expect(withoutEnv.QUANTUM_PORTFOLIO_URL).toBe(
      'http://127.0.0.1:8000/v1/portfolio.json'
    );
    expect(withBlankEnv.QUANTUM_API_BASE_URL).toBe('http://127.0.0.1:8000/v1');
  });

  it('uses the env override and trims trailing slashes', () => {
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/api/quantum/';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe('https://example.com/api/quantum');
    expect(config.QUANTUM_PORTFOLIO_URL).toBe('https://example.com/api/quantum/portfolio.json');
  });
});
