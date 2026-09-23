import type { EmailOtpType } from '@supabase/supabase-js';

const TOKEN_HASH_TYPES = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
]);

export function normalizeQuantumOtpType(value: string | undefined) {
  if (!value) return null;

  const normalized = value.toLowerCase();
  return TOKEN_HASH_TYPES.has(normalized as EmailOtpType)
    ? (normalized as EmailOtpType)
    : null;
}

export function readImplicitAuthError(hash: string | undefined) {
  if (!hash) return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return params.get('error_description') ?? params.get('error');
}
