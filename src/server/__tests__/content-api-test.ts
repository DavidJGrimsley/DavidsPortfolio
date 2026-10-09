import { GET } from '@/app/api/content+api';
import type { ContentPayload } from '@/types/content';

describe('services content API', () => {
  it('returns one business email hosting service after Website Building and preserves existing services', async () => {
    const response = GET();
    const payload = (await response.json()) as ContentPayload;

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(payload.version).toBe('2026-10-07.v1');
    expect(Number.isNaN(Date.parse(payload.generatedAt))).toBe(false);
    expect(payload.services.map((service) => service.id)).toEqual([
      'app-development',
      'website-building',
      'mail-hosting',
      'game-development',
      'tutoring',
      'online-presence',
    ]);
    expect(payload.services.filter((service) => service.id === 'mail-hosting')).toEqual([
      {
        id: 'mail-hosting',
        title: 'Business Email Hosting',
        tagline: 'Your domain. Your inbox. Professionally configured.',
        description:
          'Move beyond generic email addresses with secure, professional email using your own domain, configured from server to inbox.',
        features: [
          'Professional addresses like info@yourdomain.com',
          'Secure sending, receiving, spam-authentication, and SSL',
          'Webmail plus phone and computer setup',
        ],
        primaryCtaLabel: 'Start Email Hosting Intake',
        primaryCtaId: 'mail-hosting',
        intakeUrl: '/services/mail-hosting',
        accent: '#14b8a6',
      },
    ]);
  });
});
