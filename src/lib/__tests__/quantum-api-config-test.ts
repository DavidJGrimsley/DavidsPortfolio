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
    return require('../quantum-api-config') as typeof import('../quantum-api-config');
  }

  it('falls back to the production base url when the env var is missing or blank', () => {
    delete process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL;

    const withoutEnv = loadConfig();

    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = '   ';
    jest.resetModules();
    const withBlankEnv = loadConfig();

    expect(withoutEnv.QUANTUM_API_BASE_URL).toBe('https://davidjgrimsley.com/public-facing/api/quantum');
    expect(withoutEnv.QUANTUM_PORTFOLIO_URL).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum/portfolio.json'
    );
    expect(withBlankEnv.QUANTUM_API_BASE_URL).toBe(
      'https://davidjgrimsley.com/public-facing/api/quantum'
    );
  });

  it('uses the env override and trims trailing slashes', () => {
    process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL = 'https://example.com/api/quantum/';

    const config = loadConfig();

    expect(config.QUANTUM_API_BASE_URL).toBe('https://example.com/api/quantum');
    expect(config.QUANTUM_PORTFOLIO_URL).toBe('https://example.com/api/quantum/portfolio.json');
  });
});
