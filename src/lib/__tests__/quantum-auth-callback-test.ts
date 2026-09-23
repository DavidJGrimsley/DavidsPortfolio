import {
  normalizeQuantumOtpType,
  readImplicitAuthError,
} from '../quantum-auth-callback';

describe('Quantum auth callback parsing', () => {
  it.each(['signup', 'magiclink'] as const)(
    'preserves the %s token verification type',
    (type) => {
      expect(normalizeQuantumOtpType(type)).toBe(type);
    },
  );

  it('reads OAuth errors from the URL fragment', () => {
    expect(
      readImplicitAuthError('#error=access_denied&error_description=The+user+cancelled'),
    ).toBe('The user cancelled');
  });

  it('falls back to the OAuth error code when there is no description', () => {
    expect(readImplicitAuthError('#error=access_denied')).toBe('access_denied');
  });
});
