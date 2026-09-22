import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import type { EmailOtpType } from '@supabase/supabase-js';

import { ThemedText } from '@/components/UI/ThemedText';
import { CompanyButton } from '@/components/PublicFacing/api/CompanyButton';
import { QUANTUM_DASHBOARD_PATH } from '@/lib/quantum-api-config';
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';

const TOKEN_HASH_TYPES = new Set<EmailOtpType>([
  'email',
  'recovery',
  'invite',
  'email_change',
]);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeOtpType(value: string | undefined): EmailOtpType | null {
  if (!value) return null;

  const normalized = value.toLowerCase();
  if (normalized === 'signup' || normalized === 'magiclink') {
    return 'email';
  }

  return TOKEN_HASH_TYPES.has(normalized as EmailOtpType)
    ? (normalized as EmailOtpType)
    : null;
}

export default function QuantumAuthCallbackPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [message, setMessage] = useState('Finishing sign in…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callback = useMemo(
    () => ({
      code: firstParam(params.code),
      tokenHash: firstParam(params.token_hash),
      type: normalizeOtpType(firstParam(params.type)),
      error: firstParam(params.error_description) ?? firstParam(params.error),
    }),
    [params.code, params.error, params.error_description, params.token_hash, params.type],
  );

  useEffect(() => {
    let active = true;

    const finishAuth = async () => {
      if (!isSupabaseConfigured()) {
        if (active) {
          setErrorMessage(getSupabaseConfigError() ?? 'Supabase is not configured.');
        }
        return;
      }

      if (callback.error) {
        if (active) {
          setErrorMessage(callback.error.replace(/\+/g, ' '));
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        if (callback.tokenHash) {
          if (!callback.type) {
            throw new Error('This authentication link has an unsupported verification type.');
          }

          setMessage('Verifying your email…');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: callback.tokenHash,
            type: callback.type,
          });
          if (error) throw error;
        } else if (callback.code) {
          setMessage('Creating your session…');
          const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
          if (error) throw error;
        } else {
          // Implicit OAuth callbacks place the session in the URL fragment. With
          // detectSessionInUrl enabled, client initialization handles the fragment.
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;
          if (!session) {
            throw new Error('This authentication callback is missing a valid token or code.');
          }
        }

        if (!active) return;
        setMessage('Signed in. Opening your Quantum API dashboard…');
        router.replace(QUANTUM_DASHBOARD_PATH as Href);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'We could not finish signing you in. Request a new sign-in link and try again.',
        );
      }
    };

    void finishAuth();

    return () => {
      active = false;
    };
  }, [callback, router]);

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-full max-w-xl rounded-xl border border-neutral-700/60 p-6 gap-4">
        <ThemedText type="title">Quantum API authentication</ThemedText>

        {errorMessage ? (
          <>
            <ThemedText className="text-red-400">{errorMessage}</ThemedText>
            <ThemedText className="opacity-80">
              The link may already have been used or may no longer be valid. Return to the
              Quantum API page and request a fresh sign-in link.
            </ThemedText>
            <CompanyButton
              title="Back to Quantum API"
              onPress={() => router.replace(QUANTUM_DASHBOARD_PATH as Href)}
            />
          </>
        ) : (
          <View className="flex-row items-center gap-3">
            <ActivityIndicator />
            <ThemedText>{message}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}
