import { resolveRequestOrigin } from '../request-origin';

describe('request origin resolution', () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalSiteOrigin = mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
  const originalSiteUrl = mutableEnv.EXPO_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalSiteOrigin === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    } else {
      mutableEnv.EXPO_PUBLIC_SITE_ORIGIN = originalSiteOrigin;
    }

    if (originalSiteUrl === undefined) {
      delete mutableEnv.EXPO_PUBLIC_SITE_URL;
    } else {
      mutableEnv.EXPO_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it('prefers the configured https origin when the request arrives through an http proxy URL', () => {
    mutableEnv.EXPO_PUBLIC_SITE_ORIGIN =
      'https://quizzical-hofstadter.108-175-12-95.plesk.page';

    expect(
      resolveRequestOrigin(
        new Request('http://quizzical-hofstadter.108-175-12-95.plesk.page/api/portfolio/quantum')
      )
    ).toBe('https://quizzical-hofstadter.108-175-12-95.plesk.page');
  });

  it('uses forwarded protocol and host before the internal request URL', () => {
    delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    delete mutableEnv.EXPO_PUBLIC_SITE_URL;

    expect(
      resolveRequestOrigin(
        new Request('http://127.0.0.1:3000/api/portfolio/quantum', {
          headers: {
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'quizzical-hofstadter.108-175-12-95.plesk.page',
          },
        })
      )
    ).toBe('https://quizzical-hofstadter.108-175-12-95.plesk.page');
  });

  it('keeps localhost origins as http for local production testing', () => {
    delete mutableEnv.EXPO_PUBLIC_SITE_ORIGIN;
    delete mutableEnv.EXPO_PUBLIC_SITE_URL;

    expect(resolveRequestOrigin(new Request('http://localhost:3000/api/portfolio/quantum'))).toBe(
      'http://localhost:3000'
    );
  });
});
