const { loadAgreement } = require('../isquared-beta/agreement.cjs');
const { loadConfig } = require('../isquared-beta/config.cjs');
const { openDatabase } = require('../isquared-beta/db.cjs');
const { createBetaService, BetaError } = require('../isquared-beta/service.cjs');
const {
  clientAddress,
  formatCode,
  generateCode,
  hashCode,
  hashPassword,
  hashToken,
  isSameOriginRequest,
  newToken,
  normalizeCode,
  parseCookies,
  safeEqual,
  serializeCookie,
  validateManualCode,
  verifyPassword,
} = require('../isquared-beta/security.cjs');

const TEST_PEPPER = '1234567890123456789012345678901234567890';

describe('isquared-beta security utilities', () => {
  it('normalizes valid access codes and strips spaces/hyphens', () => {
    expect(normalizeCode(' 4x73b ')).toBe('4X73B');
    expect(normalizeCode('4X-73-B')).toBe('4X73B');
    expect(normalizeCode('abc12')).toBe('ABC12');
    expect(normalizeCode('123')).toBeNull(); // too short
    expect(normalizeCode('invalid!code')).toBeNull();
    expect(normalizeCode(null)).toBeNull();
    expect(normalizeCode('')).toBeNull();
  });

  it('validates manual codes strictly', () => {
    expect(validateManualCode('4X73B')).toBe('4X73B');
    expect(validateManualCode('  my-code-123  ')).toBe('MYCODE123');
    expect(() => validateManualCode('1234')).toThrow(/5-32/);
    expect(() => validateManualCode('bad!')).toThrow(/5-32/);
  });

  it('generates unambiguous 12-char codes', () => {
    const code = generateCode();
    expect(code).toHaveLength(12);
    expect(/^[A-Z0-9]{12}$/.test(code)).toBe(true);
    // Should not contain ambiguous characters: 0, O, 1, I, L
    expect(/[0O1IL]/.test(code)).toBe(false);
    expect(formatCode(code)).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(formatCode('4X73B')).toBe('4X73B');
  });

  it('hashes codes with keyed HMAC and hashes tokens with SHA-256', () => {
    const hash1 = hashCode(TEST_PEPPER, '4X73B');
    const hash2 = hashCode(TEST_PEPPER, '4X73B');
    const hash3 = hashCode('different_pepper_that_is_at_least_32_chars!', '4X73B');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);

    const token = newToken();
    expect(token).toHaveLength(43); // 32 bytes in base64url
    const thash = hashToken(token);
    expect(thash).toHaveLength(64);
  });

  it('performs constant-time safeEqual comparison', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'ab')).toBe(false);
  });

  it('hashes passwords with scrypt and verifies correctly', () => {
    const pass = 'super-secret-password-123';
    const hash = hashPassword(pass);
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword(pass, hash)).toBe(true);
    expect(verifyPassword('wrong-password', hash)).toBe(false);
    expect(verifyPassword('', hash)).toBe(false);
    expect(() => hashPassword('short')).toThrow(/12 characters/);
  });

  it('parses and serializes cookies properly', () => {
    const header = 'foo=bar; isq_beta=token123; test=value';
    const parsed = parseCookies(header);
    expect(parsed.foo).toBe('bar');
    expect(parsed.isq_beta).toBe('token123');
    expect(parsed.test).toBe('value');

    const serialized = serializeCookie('isq_beta', 'token123', {
      path: '/iSquared',
      maxAgeSeconds: 3600,
      secure: true,
      sameSite: 'Lax',
    });
    expect(serialized).toContain('isq_beta=token123');
    expect(serialized).toContain('Path=/iSquared');
    expect(serialized).toContain('HttpOnly');
    expect(serialized).toContain('Secure');
    expect(serialized).toContain('SameSite=Lax');
    expect(serialized).toContain('Max-Age=3600');
  });

  it('extracts trusted client address from X-Forwarded-For with hops', () => {
    const req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
    };
    // 1 reverse proxy (e.g. nginx) appending its client IP -> last entry
    expect(clientAddress(req, 1)).toBe('150.172.238.178');
    // 2 proxies
    expect(clientAddress(req, 2)).toBe('70.41.3.18');
    // More hops requested than header entries -> safely falls back to list[0] (not internal loopback socket)
    expect(clientAddress(req, 5)).toBe('203.0.113.195');
    // 0 hops -> raw socket address
    expect(clientAddress(req, 0)).toBe('10.0.0.1');
    // Empty list falls back to socket address
    expect(clientAddress({ socket: { remoteAddress: '10.0.0.1' }, headers: {} }, 1)).toBe('10.0.0.1');
  });

  it('enforces same-origin request safety', () => {
    expect(
      isSameOriginRequest(
        { headers: { host: 'davidjgrimsley.com', origin: 'https://davidjgrimsley.com' } },
        'https://davidjgrimsley.com'
      )
    ).toBe(true);

    // Cross origin
    expect(
      isSameOriginRequest(
        { headers: { host: 'davidjgrimsley.com', origin: 'https://evil.com' } },
        'https://davidjgrimsley.com'
      )
    ).toBe(false);

    // Rejects client-spoofed X-Forwarded-Host even when Sec-Fetch-Site is absent
    expect(
      isSameOriginRequest(
        { headers: { host: 'davidjgrimsley.com', 'x-forwarded-host': 'evil.com', origin: 'https://evil.com' } },
        'https://davidjgrimsley.com'
      )
    ).toBe(false);

    // Cross site fetch site
    expect(
      isSameOriginRequest(
        {
          headers: {
            host: 'davidjgrimsley.com',
            origin: 'https://davidjgrimsley.com',
            'sec-fetch-site': 'cross-site',
          },
        },
        'https://davidjgrimsley.com'
      )
    ).toBe(false);
  });
});

describe('isquared-beta agreement system', () => {
  it('loads agreement and computes immutable digest', () => {
    const agreement = loadAgreement();
    expect(agreement.version).toBe('1');
    expect(agreement.title).toContain('iSquared Private Preview');
    expect(agreement.statement).toContain('invitation-only prototype');
    expect(agreement.checkboxLabel).toContain('agree to the confidentiality terms');
    expect(agreement.terms.length).toBeGreaterThan(0);
    expect(agreement.digest).toHaveLength(64);
  });
});

describe('isquared-beta service and database', () => {
  let db;
  let service;
  let config;
  let agreement;
  let fakeNowMs;

  beforeEach(() => {
    fakeNowMs = Date.parse('2026-11-10T12:00:00.000Z');
    agreement = loadAgreement();
    const dbResult = openDatabase(':memory:');
    db = dbResult.db;
    config = {
      mountPath: '/iSquared',
      pepper: TEST_PEPPER,
      sessionTtlMs: 12 * 3600_000,
      idleTimeoutMs: 240 * 60_000,
      visitGapMs: 30 * 60_000,
      adminSessionTtlMs: 8 * 3600_000,
      limits: {
        ipFailures: 8,
        ipWindowMs: 15 * 60_000,
        globalFailures: 100,
        globalWindowMs: 60 * 60_000,
        adminIpFailures: 5,
        adminGlobalFailures: 30,
      },
      admin: {
        username: 'admin',
        passwordHash: hashPassword('admin-password-123'),
      },
    };
    service = createBetaService({
      db,
      config,
      agreement,
      now: () => fakeNowMs,
    });
    service.registerAgreement();
  });

  afterEach(() => {
    db.close();
  });

  it('prevents registering a modified agreement under an existing version', () => {
    const tampered = { ...agreement, digest: 'changed-digest', statement: 'Tampered' };
    const badService = createBetaService({
      db,
      config,
      agreement: tampered,
      now: () => fakeNowMs,
    });
    expect(() => badService.registerAgreement()).toThrow(BetaError);
  });

  it('creates testers with manual or generated codes and prevents duplicates', () => {
    const t1 = service.createTester({ name: 'Jane Smith', code: '4X73B' });
    expect(t1.tester.name).toBe('Jane Smith');
    expect(t1.code).toBe('4X73B');
    expect(t1.generated).toBe(false);

    // Duplicate name rejected
    expect(() => service.createTester({ name: 'jane smith', code: 'ANOTHER' })).toThrow(BetaError);
    // Duplicate code rejected
    expect(() => service.createTester({ name: 'Bob Jones', code: '4X73B' })).toThrow(BetaError);

    // Generated code
    const t2 = service.createTester({ name: 'Bob Jones' });
    expect(t2.tester.name).toBe('Bob Jones');
    expect(t2.code).toHaveLength(12);
    expect(t2.generated).toBe(true);

    // Find tester by id or name
    expect(service.findTester(t1.tester.id).name).toBe('Jane Smith');
    expect(service.findTester('Jane Smith').id).toBe(t1.tester.id);
    expect(service.findTester('jane smith').id).toBe(t1.tester.id);
    expect(() => service.findTester('Unknown')).toThrow(BetaError);
    expect(() => service.findTester('')).toThrow(BetaError);
    expect(() => service.findTester('   ')).toThrow(BetaError);
    expect(() => service.findTester(null)).toThrow(BetaError);
  });

  it('handles tester expiry validation', () => {
    // Past date rejected
    expect(() =>
      service.createTester({ name: 'Past Tester', code: 'PAST1', expiresAt: '2026-11-01' })
    ).toThrow(BetaError);

    // Future date accepted
    const t = service.createTester({ name: 'Future Tester', code: 'FUTUR', expiresAt: '2026-12-01' });
    expect(t.tester.expires_at).toBe('2026-12-01T23:59:59.999Z');

    // Update expiry
    service.setExpiry(t.tester.id, '2026-12-15');
    expect(service.getTester(t.tester.id).expires_at).toBe('2026-12-15T23:59:59.999Z');
    // Clear expiry
    service.setExpiry(t.tester.id, 'none');
    expect(service.getTester(t.tester.id).expires_at).toBeNull();
  });

  it('authenticates valid tester and rejects invalid codes, inactive, or expired testers', () => {
    const { code } = service.createTester({ name: 'Jane Smith', code: '4X73B' });

    // Missing terms acceptance
    const resNoAgree = service.authenticate({
      code,
      accepted: false,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(resNoAgree.ok).toBe(false);
    expect(resNoAgree.reason).toBe('terms_not_accepted');

    // Outdated agreement
    const resOutdated = service.authenticate({
      code,
      accepted: true,
      agreementVersion: '99',
      agreementDigest: agreement.digest,
    });
    expect(resOutdated.ok).toBe(false);
    expect(resOutdated.reason).toBe('terms_outdated');

    // Invalid code
    const resBadCode = service.authenticate({
      code: 'WRONGCODE',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(resBadCode.ok).toBe(false);
    expect(resBadCode.reason).toBe('invalid_code');

    // Successful login
    const resGood = service.authenticate({
      code: ' 4x-73b ',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(resGood.ok).toBe(true);
    expect(resGood.token).toBeTruthy();
    expect(resGood.tester.name).toBe('Jane Smith');

    // Verify agreement accepted recorded
    const agreements = service.listAgreementsFor(resGood.tester.id);
    expect(agreements).toHaveLength(1);
    expect(agreements[0].agreement_version).toBe(agreement.version);

    // Inactive tester fails
    service.setActive(resGood.tester.id, false);
    const resDisabled = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(resDisabled.ok).toBe(false);
    expect(resDisabled.reason).toBe('inactive');

    // Re-enable tester, set expired
    service.setActive(resGood.tester.id, true);
    // Move time forward past expiry
    service.setExpiry(resGood.tester.id, '2026-11-10');
    fakeNowMs += 2 * 86_400_000; // 2 days later
    const resExpired = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(resExpired.ok).toBe(false);
    expect(resExpired.reason).toBe('expired');
  });

  it('enforces rate limiting on failed authentication attempts', () => {
    service.createTester({ name: 'Jane Smith', code: '4X73B' });
    const client = '198.51.100.1';

    // 8 failures allowed by config limit
    for (let i = 0; i < 8; i++) {
      const res = service.authenticate({
        code: 'BADCODE',
        accepted: true,
        agreementVersion: agreement.version,
        agreementDigest: agreement.digest,
        clientAddress: client,
      });
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('invalid_code');
    }

    // 9th attempt is rate-limited even if correct code is entered!
    const blocked = service.authenticate({
      code: '4X73B',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
      clientAddress: client,
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe('rate_limited');
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // Different client address is not blocked
    const otherClient = service.authenticate({
      code: '4X73B',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
      clientAddress: '198.51.100.2',
    });
    expect(otherClient.ok).toBe(true);

    // Unlock clears rate limits
    service.resetRateLimits();
    const unblocked = service.authenticate({
      code: '4X73B',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
      clientAddress: client,
    });
    expect(unblocked.ok).toBe(true);
  });

  it('manages sessions: expiration, idle timeout, revocation, rotation, logout', () => {
    const { code, tester } = service.createTester({ name: 'Jane Smith', code: '4X73B' });
    const auth = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(auth.ok).toBe(true);

    // Validate active session
    let session = service.validateSession(auth.token);
    expect(session).not.toBeNull();
    expect(session.testerName).toBe('Jane Smith');

    // Idle timeout: advance time by 241 minutes (idle timeout is 240)
    fakeNowMs += 241 * 60_000;
    expect(service.validateSession(auth.token)).toBeNull();

    // New login
    const auth2 = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(service.validateSession(auth2.token)).not.toBeNull();

    // Disabling tester revokes sessions
    service.setActive(tester.id, false);
    expect(service.validateSession(auth2.token)).toBeNull();

    // Re-enable and login again
    service.setActive(tester.id, true);
    const auth3 = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(service.validateSession(auth3.token)).not.toBeNull();

    // Code rotation revokes existing sessions and replaces code
    const rotated = service.rotateCode(tester.id, 'NEWCODE123');
    expect(rotated.code).toBe('NEWCODE123');
    expect(service.validateSession(auth3.token)).toBeNull(); // revoked!

    // Old code no longer works
    const oldAuth = service.authenticate({
      code: '4X73B',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(oldAuth.ok).toBe(false);

    // New code works
    const newAuth = service.authenticate({
      code: 'NEWCODE123',
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    expect(newAuth.ok).toBe(true);

    // Logout revokes session
    expect(service.logout(newAuth.token)).toBe(true);
    expect(service.validateSession(newAuth.token)).toBeNull();
  });

  it('tracks logins and visits accurately with reload throttling', () => {
    const { code } = service.createTester({ name: 'Jane Smith', code: '4X73B' });
    const auth = service.authenticate({
      code,
      accepted: true,
      agreementVersion: agreement.version,
      agreementDigest: agreement.digest,
    });
    const session = service.validateSession(auth.token);

    // Visit 1: first visit
    expect(service.recordVisit(session)).toBe(true);

    // Visit 2: immediate reload within visitGapMs (30 min) -> throttled
    fakeNowMs += 5 * 60_000; // 5 mins later
    expect(service.recordVisit(session)).toBe(false);

    // Visit 3: reload after 31 mins from last activity -> recorded as new visit
    fakeNowMs += 31 * 60_000;
    expect(service.recordVisit(session)).toBe(true);

    const stats = service.stats({ days: 30 });
    expect(stats.summary.totalLogins).toBe(1);
    expect(stats.summary.totalVisits).toBe(2);
    expect(stats.testers[0].logins).toBe(1);
    expect(stats.testers[0].visits).toBe(2);
    expect(stats.testers[0].activeInPeriod).toBe(true);

    // History contains login, visit, visit
    const history = service.testerHistory(session.testerId);
    expect(history.filter((e) => e.type === 'login')).toHaveLength(1);
    expect(history.filter((e) => e.type === 'visit')).toHaveLength(2);
  });

  it('handles admin sessions, rate limits, and verification', () => {
    expect(service.adminLoginGate('1.2.3.4').blocked).toBe(false);

    // 5 failures trigger rate limit
    for (let i = 0; i < 5; i++) {
      service.recordAdminLoginFailure('1.2.3.4');
    }
    expect(service.adminLoginGate('1.2.3.4').blocked).toBe(true);

    // Create and validate admin session
    const adminSess = service.createAdminSession();
    expect(adminSess.token).toBeTruthy();
    expect(service.validateAdminSession(adminSess.token)).not.toBeNull();

    // Revoke admin session
    expect(service.revokeAdminSession(adminSess.token)).toBe(true);
    expect(service.validateAdminSession(adminSess.token)).toBeNull();
  });
});
