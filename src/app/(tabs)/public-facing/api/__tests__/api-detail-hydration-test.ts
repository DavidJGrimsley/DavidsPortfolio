import { resolveBrowserApiBaseUrl } from '@/lib/browser-api-base-url';

describe('API detail hydration URL handling', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
      return;
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
  });

  function setWindowOrigin(origin: string) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          origin,
          hostname: new URL(origin).hostname,
          port: new URL(origin).port,
        },
      },
    });
  }

  it('keeps the server-rendered base URL before hydration', () => {
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    expect(
      resolveBrowserApiBaseUrl(
        {
          baseUrl: 'http://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1',
          publicBasePath: '/api/public/quantum/v1',
        },
        false
      )
    ).toBe('http://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1');
  });

  it('rewrites unsafe http staging URLs after hydration', () => {
    setWindowOrigin('https://quizzical-hofstadter.108-175-12-95.plesk.page');

    expect(
      resolveBrowserApiBaseUrl(
        {
          baseUrl: 'http://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1',
          publicBasePath: '/api/public/quantum/v1',
        },
        true
      )
    ).toBe('https://quizzical-hofstadter.108-175-12-95.plesk.page/api/public/quantum/v1');
  });
});
