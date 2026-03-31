import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Line } from 'react-native-svg';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CompanyButton } from './CompanyButton';
import {
  getQuantumAuthRedirectUrl,
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';
import {
  createQuantumKey,
  deleteQuantumKey,
  deleteRevokedQuantumKeys,
  listQuantumKeys,
  type QuantumKeyRecord,
  QuantumApiError,
  revokeQuantumKey,
  rotateQuantumKey,
} from '@/services/quantum-key-management';

type QuantumAuthDashboardCardProps = {
  baseUrl: string;
};

type RawKeyReveal = {
  action: 'created' | 'rotated';
  rawKey: string;
  label: string;
};

const IDENTEREST_LOGO = require('~/assets/images/identerest-logo.png');
const CREATISPHERE_LOGO = require('~/assets/images/creatisphere-logo.png');
const HIGHER_LOGO = require('~/assets/images/higher-logo.png');

const BRAND_COLORS = {
  identerest: { primary: '#475569', secondary: '#94a3b8' },
  creatisphere: { primary: '#ff5e00', secondary: '#1058bc' },
  higher: { primary: '#228B22', secondary: '#C3B091' },
} as const;

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

async function copyToClipboard(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Copy is only available in a browser with clipboard access.');
  }

  await navigator.clipboard.writeText(value);
}

export function QuantumAuthDashboardCard({
  baseUrl,
}: QuantumAuthDashboardCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');

  const [email, setEmail] = useState('');
  const [keyName, setKeyName] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [keys, setKeys] = useState<QuantumKeyRecord[]>([]);
  const [rawKeyReveal, setRawKeyReveal] = useState<RawKeyReveal | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [startingGithubSignIn, setStartingGithubSignIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);
  const [deletingRevokedKeys, setDeletingRevokedKeys] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [showIdenterestInfo, setShowIdenterestInfo] = useState(false);

  const supabaseClient = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return getSupabaseBrowserClient();
  }, []);

  const accessToken = session?.access_token ?? null;
  const revokedKeysCount = useMemo(
    () => keys.filter((key) => key.status === 'revoked').length,
    [keys]
  );

  const refreshKeys = useCallback(async () => {
    if (!accessToken) {
      setKeys([]);
      return;
    }

    setLoadingKeys(true);
    setKeysError(null);

    try {
      const records = await listQuantumKeys(baseUrl, accessToken);
      setKeys(records);
    } catch (error) {
      setKeysError(
        error instanceof QuantumApiError
          ? error.message
          : 'Unable to load your Quantum API keys right now.'
      );
    } finally {
      setLoadingKeys(false);
    }
  }, [accessToken, baseUrl]);

  useEffect(() => {
    let isActive = true;

    if (!supabaseClient) {
      setBootstrapping(false);
      return;
    }

    const bootstrapSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (!isActive) return;

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session);
      setBootstrapping(false);
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;

      setSession(nextSession);
      setAuthError(null);
      setAuthMessage(null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  useEffect(() => {
    if (!accessToken) {
      setKeys([]);
      setRawKeyReveal(null);
      setLoadingKeys(false);
      return;
    }

    refreshKeys();
  }, [accessToken, refreshKeys]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError =
      params.get('error_description') ??
      params.get('error') ??
      hashParams.get('error_description') ??
      hashParams.get('error');

    if (oauthError) {
      setAuthError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
    }
  }, []);

  const handleMagicLink = useCallback(async () => {
    if (!supabaseClient) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setAuthError('Enter an email address to receive a magic link.');
      return;
    }

    setSendingMagicLink(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getQuantumAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      setAuthMessage(`Magic link sent to ${normalizedEmail}. Open it in this browser to finish sign in.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to send the magic link.');
    } finally {
      setSendingMagicLink(false);
    }
  }, [email, supabaseClient]);

  const handleGithubSignIn = useCallback(async () => {
    if (!supabaseClient) return;

    setStartingGithubSignIn(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: getQuantumAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to start GitHub sign in.');
      setStartingGithubSignIn(false);
    }
  }, [supabaseClient]);

  const handleSignOut = useCallback(async () => {
    if (!supabaseClient) return;

    setSigningOut(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }

      setSession(null);
      setKeys([]);
      setKeyName('');
      setRawKeyReveal(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setSigningOut(false);
    }
  }, [supabaseClient]);

  const handleCreateKey = useCallback(async () => {
    if (!accessToken) return;

    setCreatingKey(true);
    setKeysError(null);

    try {
      const result = await createQuantumKey(baseUrl, accessToken, {
        name: keyName.trim() || undefined,
      });

      if (!result.rawKey) {
        throw new Error('The API created the key, but no raw key was returned.');
      }

      setRawKeyReveal({
        action: 'created',
        rawKey: result.rawKey,
        label: (result.key?.label ?? keyName.trim()) || 'New Quantum key',
      });
      setKeyName('');
      await refreshKeys();
    } catch (error) {
      setKeysError(error instanceof Error ? error.message : 'Unable to create a new API key.');
    } finally {
      setCreatingKey(false);
    }
  }, [accessToken, baseUrl, keyName, refreshKeys]);

  const handleRotateKey = useCallback(
    async (key: QuantumKeyRecord) => {
      if (!accessToken) return;

      setBusyKeyId(key.id);
      setKeysError(null);

      try {
        const result = await rotateQuantumKey(baseUrl, accessToken, key.id);
        if (!result.rawKey) {
          throw new Error('The API rotated the key, but no raw key was returned.');
        }

        setRawKeyReveal({
          action: 'rotated',
          rawKey: result.rawKey,
          label: result.key?.label ?? key.label,
        });
        await refreshKeys();
      } catch (error) {
        setKeysError(error instanceof Error ? error.message : 'Unable to rotate this key.');
      } finally {
        setBusyKeyId(null);
      }
    },
    [accessToken, baseUrl, refreshKeys]
  );

  const handleRevokeKey = useCallback(
    async (key: QuantumKeyRecord) => {
      if (!accessToken) return;

      setBusyKeyId(key.id);
      setKeysError(null);

      try {
        await revokeQuantumKey(baseUrl, accessToken, key.id);
        if (rawKeyReveal?.label === key.label) {
          setRawKeyReveal(null);
        }
        await refreshKeys();
      } catch (error) {
        setKeysError(error instanceof Error ? error.message : 'Unable to revoke this key.');
      } finally {
        setBusyKeyId(null);
      }
    },
    [accessToken, baseUrl, rawKeyReveal?.label, refreshKeys]
  );

  const handleDeleteRevokedKey = useCallback(
    async (key: QuantumKeyRecord) => {
      if (!accessToken) return;
      if (key.status !== 'revoked') return;

      if (
        typeof window !== 'undefined' &&
        !window.confirm(`Delete revoked key "${key.label}" permanently?`)
      ) {
        return;
      }

      setBusyKeyId(key.id);
      setKeysError(null);

      try {
        await deleteQuantumKey(baseUrl, accessToken, key.id);
        if (rawKeyReveal?.label === key.label) {
          setRawKeyReveal(null);
        }
        await refreshKeys();
      } catch (error) {
        setKeysError(error instanceof Error ? error.message : 'Unable to delete this revoked key.');
      } finally {
        setBusyKeyId(null);
      }
    },
    [accessToken, baseUrl, rawKeyReveal?.label, refreshKeys]
  );

  const handleDeleteAllRevokedKeys = useCallback(async () => {
    if (!accessToken) return;
    if (revokedKeysCount <= 0) {
      setKeysError('No revoked keys to delete.');
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Delete all ${revokedKeysCount} revoked keys permanently?`)
    ) {
      return;
    }

    setDeletingRevokedKeys(true);
    setKeysError(null);

    try {
      const result = await deleteRevokedQuantumKeys(baseUrl, accessToken);
      if (result.deletedCount <= 0) {
        setKeysError('No revoked keys were deleted.');
      }
      await refreshKeys();
    } catch (error) {
      setKeysError(error instanceof Error ? error.message : 'Unable to delete revoked keys.');
    } finally {
      setDeletingRevokedKeys(false);
    }
  }, [accessToken, baseUrl, refreshKeys, revokedKeysCount]);

  const handleCopy = useCallback(async (value: string, key: string) => {
    try {
      await copyToClipboard(value);
      setCopiedValue(key);
      setTimeout(() => setCopiedValue((current) => (current === key ? null : current)), 1800);
    } catch (error) {
      setKeysError(error instanceof Error ? error.message : 'Unable to copy to clipboard.');
    }
  }, []);

  return (
    <View
      className="mb-7.5 rounded-3xl border p-4 md:p-5"
      style={{
        backgroundColor: accentColor + '18',
        borderColor: tintColor + '33',
      }}
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <ThemedText type="subtitle" className="mb-1 text-2xl md:text-3xl">
            Api Keys
          </ThemedText>
          <ThemedText className="opacity-85 text-base leading-6 md:text-lg">
            Obtain API keys to use this service. There are rate limits applied to each key. New secrets are shown once, then stored only as masked metadata.
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About Identerest account"
          onPress={() => setShowIdenterestInfo(true)}
          style={({ pressed }) => ({
            backgroundColor: '#ffffff',
            borderColor: '#ffffffcc',
            borderCurve: 'continuous',
            borderRadius: 18,
            borderWidth: 1,
            opacity: pressed ? 0.78 : 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
          })}
        >
          <View className="flex-row items-center gap-2">
            <Image
              source={IDENTEREST_LOGO}
              resizeMode="contain"
              style={{ height: 20, width: 20 }}
            />
            <ThemedText
              className="text-xs tracking-[0.08em]"
              style={{ color: '#4b5563', fontFamily: 'Emblema One' }}
            >
              Identerest
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {!isSupabaseConfigured() ? (
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: backgroundColor,
            borderColor: '#ef444466',
          }}
        >
          <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
            Identerest auth is not configured yet
          </ThemedText>
          <ThemedText selectable className="opacity-85 text-base leading-6">
            {getSupabaseConfigError()} Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable Identerest Account sign in on this page.
          </ThemedText>
        </View>
      ) : bootstrapping ? (
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: backgroundColor }}
        >
          <ActivityIndicator color={tintColor} />
          <ThemedText className="mt-3 text-center opacity-80">
            Restoring your session...
          </ThemedText>
        </View>
      ) : (
        <View className="gap-4">
          {authError ? (
            <View
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: '#ef444418',
                borderColor: '#ef444455',
              }}
            >
              <ThemedText selectable className="text-base leading-6" style={{ color: '#f87171' }}>
                {authError}
              </ThemedText>
            </View>
          ) : null}

          {authMessage ? (
            <View
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: tintColor + '16',
                borderColor: tintColor + '40',
              }}
            >
              <ThemedText selectable className="text-base leading-6">
                {authMessage}
              </ThemedText>
            </View>
          ) : null}

          {!session ? (
            <View
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: backgroundColor,
                borderColor: accentColor + '35',
              }}
            >
              <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
                Keys are managed by your Identerest Account
              </ThemedText>
              <ThemedText className="mb-4 opacity-80 text-base leading-6">
                Sign-in or Create an account today! Use a passwordless email magic link or continue with GitHub.
              </ThemedText>

              <View className="gap-3">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={textColor + '70'}
                  style={{
                    backgroundColor: accentColor + '12',
                    borderColor: tintColor + '30',
                    borderCurve: 'continuous',
                    borderRadius: 16,
                    borderWidth: 1,
                    color: textColor,
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                  value={email}
                />

                <View className="gap-3 md:flex-row">
                  <Pressable
                    disabled={sendingMagicLink}
                    onPress={handleMagicLink}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: tintColor,
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      flex: 1,
                      flexDirection: 'row',
                      gap: 10,
                      justifyContent: 'center',
                      opacity: pressed || sendingMagicLink ? 0.72 : 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    })}
                  >
                    {sendingMagicLink ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons color="#fff" name="mail-outline" size={18} />
                        <ThemedText inverse className="font-bold text-base">
                          Email Magic Link
                        </ThemedText>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    disabled={startingGithubSignIn}
                    onPress={handleGithubSignIn}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: backgroundColor,
                      borderColor: accentColor + '45',
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      borderWidth: 1,
                      flex: 1,
                      flexDirection: 'row',
                      gap: 10,
                      justifyContent: 'center',
                      opacity: pressed || startingGithubSignIn ? 0.72 : 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    })}
                  >
                    {startingGithubSignIn ? (
                      <ActivityIndicator color={secondaryColor} />
                    ) : (
                      <>
                        <Ionicons color={secondaryColor} name="logo-github" size={18} />
                        <ThemedText className="font-bold text-base" style={{ color: secondaryColor }}>
                          Continue with GitHub
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <View
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: backgroundColor,
                  borderColor: accentColor + '35',
                }}
              >
                <View className="mb-4 flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                      Signed in via Identerest Account
                    </ThemedText>
                    <ThemedText selectable className="opacity-80 text-base leading-6">
                      {session.user.email ?? 'Authenticated Quantum user'}
                    </ThemedText>
                  </View>

                  <Pressable
                    disabled={signingOut}
                    onPress={handleSignOut}
                    style={({ pressed }) => ({
                      backgroundColor: accentColor + '18',
                      borderCurve: 'continuous',
                      borderRadius: 14,
                      opacity: pressed || signingOut ? 0.72 : 1,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    })}
                  >
                    {signingOut ? (
                      <ActivityIndicator color={secondaryColor} />
                    ) : (
                      <ThemedText className="font-bold text-sm uppercase tracking-[0.16em]" style={{ color: secondaryColor }}>
                        Sign out
                      </ThemedText>
                    )}
                  </Pressable>
                </View>

                <View className="gap-3 md:flex-row md:items-center">
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setKeyName}
                    placeholder="Optional key label"
                    placeholderTextColor={textColor + '70'}
                    style={{
                      backgroundColor: accentColor + '12',
                      borderColor: tintColor + '30',
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      borderWidth: 1,
                      color: textColor,
                      flex: 1,
                      fontSize: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                    }}
                    value={keyName}
                  />

                  <Pressable
                    disabled={creatingKey}
                    onPress={handleCreateKey}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: tintColor,
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      justifyContent: 'center',
                      minWidth: 156,
                      opacity: pressed || creatingKey ? 0.72 : 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    })}
                  >
                    {creatingKey ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ThemedText inverse className="font-bold text-base">
                        Create Key
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>

              {rawKeyReveal ? (
                <View
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: tintColor + '12',
                    borderColor: tintColor + '3f',
                  }}
                >
                  <View className="mb-2 flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                        {rawKeyReveal.action === 'created' ? 'New key generated' : 'Key rotated'}
                      </ThemedText>
                      <ThemedText className="opacity-80 text-base leading-6">
                        Save this secret now. After you leave this state, only the masked version remains visible.
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() => setRawKeyReveal(null)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.72 : 1,
                        padding: 2,
                      })}
                    >
                      <Ionicons color={textColor} name="close" size={18} />
                    </Pressable>
                  </View>

                  <View
                    className="rounded-2xl border p-3"
                    style={{
                      backgroundColor: backgroundColor,
                      borderColor: tintColor + '2a',
                    }}
                  >
                    <ThemedText className="mb-1 opacity-70 text-sm uppercase tracking-[0.16em]">
                      {rawKeyReveal.label}
                    </ThemedText>
                    <ThemedText
                      selectable
                      className="font-mono text-sm leading-6"
                      style={{ color: secondaryColor }}
                    >
                      {rawKeyReveal.rawKey}
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() => handleCopy(rawKeyReveal.rawKey, rawKeyReveal.rawKey)}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      backgroundColor: backgroundColor,
                      borderColor: tintColor + '30',
                      borderCurve: 'continuous',
                      borderRadius: 14,
                      borderWidth: 1,
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 12,
                      opacity: pressed ? 0.72 : 1,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    })}
                  >
                    <Ionicons
                      color={secondaryColor}
                      name={copiedValue === rawKeyReveal.rawKey ? 'checkmark' : 'copy-outline'}
                      size={16}
                    />
                    <ThemedText className="font-bold text-sm uppercase tracking-[0.14em]" style={{ color: secondaryColor }}>
                      {copiedValue === rawKeyReveal.rawKey ? 'Copied' : 'Copy secret'}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}

              {keysError ? (
                <View
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: '#ef444418',
                    borderColor: '#ef444455',
                  }}
                >
                  <ThemedText selectable className="text-base leading-6" style={{ color: '#f87171' }}>
                    {keysError}
                  </ThemedText>
                </View>
              ) : null}

              <View
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: backgroundColor,
                  borderColor: accentColor + '35',
                }}
              >
                <View className="mb-4 flex-row items-center justify-between gap-3">
                  <View>
                    <ThemedText type="defaultSemiBold" className="text-lg">
                      API Keys
                    </ThemedText>
                    <ThemedText className="opacity-75 text-base">
                      Masked metadata only
                    </ThemedText>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      disabled={deletingRevokedKeys || loadingKeys || revokedKeysCount <= 0}
                      onPress={handleDeleteAllRevokedKeys}
                      style={({ pressed }) => ({
                        alignItems: 'center',
                        backgroundColor: backgroundColor,
                        borderColor: '#ef444466',
                        borderCurve: 'continuous',
                        borderRadius: 12,
                        borderWidth: 1,
                        justifyContent: 'center',
                        minHeight: 30,
                        opacity:
                          pressed || deletingRevokedKeys || loadingKeys || revokedKeysCount <= 0
                            ? 0.65
                            : 1,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                      })}
                    >
                      {deletingRevokedKeys ? (
                        <ActivityIndicator color="#f87171" />
                      ) : (
                        <ThemedText className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: '#f87171' }}>
                          Delete Revoked
                        </ThemedText>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={refreshKeys}
                      style={({ pressed }) => ({
                        opacity: pressed || loadingKeys ? 0.72 : 1,
                        padding: 4,
                      })}
                    >
                      {loadingKeys ? (
                        <ActivityIndicator color={secondaryColor} />
                      ) : (
                        <Ionicons color={secondaryColor} name="refresh" size={18} />
                      )}
                    </Pressable>
                  </View>
                </View>

                {loadingKeys ? (
                  <View className="items-center py-6">
                    <ActivityIndicator color={tintColor} />
                    <ThemedText className="mt-3 opacity-75">Loading your keys...</ThemedText>
                  </View>
                ) : keys.length === 0 ? (
                  <View
                    className="rounded-2xl border border-dashed p-4"
                    style={{
                      backgroundColor: accentColor + '0d',
                      borderColor: tintColor + '33',
                    }}
                  >
                    <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                      No keys yet
                    </ThemedText>
                    <ThemedText className="opacity-80 text-base leading-6">
                      Create your first Quantum API key above. It will appear here in masked form after generation.
                    </ThemedText>
                  </View>
                ) : (
                  <View className="gap-3">
                    {keys.map((key) => {
                      const isBusy = busyKeyId === key.id;
                      const isInactive = key.status !== 'active';
                      const statusLabel =
                        key.status === 'rotated'
                          ? 'Rotated'
                          : key.status === 'revoked'
                            ? 'Revoked'
                            : 'Active';
                      const statusColor = isInactive ? '#f87171' : textColor;
                      const statusBackground = isInactive ? '#ef444422' : tintColor + '25';

                      return (
                        <View
                          key={key.id}
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: accentColor + '10',
                            borderColor: isInactive ? '#ef444455' : tintColor + '2f',
                          }}
                        >
                          <View className="mb-3 flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                                {key.label}
                              </ThemedText>
                              <ThemedText selectable className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
                                {key.maskedKey}
                              </ThemedText>
                            </View>

                            <View
                              className="rounded-full px-3 py-1"
                              style={{
                                backgroundColor: statusBackground,
                              }}
                            >
                              <ThemedText
                                className="text-xs font-bold uppercase tracking-[0.16em]"
                                style={{ color: statusColor }}
                              >
                                {statusLabel}
                              </ThemedText>
                            </View>
                          </View>

                          <View className="mb-3 gap-1">
                            <ThemedText className="opacity-75 text-sm">
                              Created: {formatTimestamp(key.createdAt)}
                            </ThemedText>
                            <ThemedText className="opacity-75 text-sm">
                              Last used: {formatTimestamp(key.lastUsedAt)}
                            </ThemedText>
                            {key.revokedAt ? (
                              <ThemedText className="opacity-75 text-sm">
                                Revoked: {formatTimestamp(key.revokedAt)}
                              </ThemedText>
                            ) : null}
                          </View>

                          {key.status === 'revoked' ? (
                            <Pressable
                              disabled={isBusy}
                              onPress={() => handleDeleteRevokedKey(key)}
                              style={({ pressed }) => ({
                                alignItems: 'center',
                                backgroundColor: backgroundColor,
                                borderColor: '#ef444466',
                                borderCurve: 'continuous',
                                borderRadius: 14,
                                borderWidth: 1,
                                justifyContent: 'center',
                                opacity: pressed || isBusy ? 0.72 : 1,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                              })}
                            >
                              {isBusy ? (
                                <ActivityIndicator color="#f87171" />
                              ) : (
                                <ThemedText className="font-bold text-sm uppercase tracking-[0.14em]" style={{ color: '#f87171' }}>
                                  Delete
                                </ThemedText>
                              )}
                            </Pressable>
                          ) : (
                            <View className="gap-3 md:flex-row">
                              <Pressable
                                disabled={isBusy || isInactive}
                                onPress={() => handleRotateKey(key)}
                                style={({ pressed }) => ({
                                  alignItems: 'center',
                                  backgroundColor: isInactive ? accentColor + '16' : tintColor,
                                  borderCurve: 'continuous',
                                  borderRadius: 14,
                                  flex: 1,
                                  justifyContent: 'center',
                                  opacity: pressed || isBusy || isInactive ? 0.72 : 1,
                                  paddingHorizontal: 14,
                                  paddingVertical: 12,
                                })}
                              >
                                {isBusy ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <ThemedText inverse className="font-bold text-sm uppercase tracking-[0.14em]">
                                    Rotate
                                  </ThemedText>
                                )}
                              </Pressable>

                              <Pressable
                                disabled={isBusy || isInactive}
                                onPress={() => handleRevokeKey(key)}
                                style={({ pressed }) => ({
                                  alignItems: 'center',
                                  backgroundColor: backgroundColor,
                                  borderColor: '#ef444466',
                                  borderCurve: 'continuous',
                                  borderRadius: 14,
                                  borderWidth: 1,
                                  flex: 1,
                                  justifyContent: 'center',
                                  opacity: pressed || isBusy || isInactive ? 0.72 : 1,
                                  paddingHorizontal: 14,
                                  paddingVertical: 12,
                                })}
                              >
                                <ThemedText className="font-bold text-sm uppercase tracking-[0.14em]" style={{ color: '#f87171' }}>
                                  Revoke
                                </ThemedText>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setShowIdenterestInfo(false)}
        transparent
        visible={showIdenterestInfo}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-4">
          <Pressable
            accessibilityLabel="Close Identerest info modal"
            accessibilityRole="button"
            className="absolute inset-0"
            onPress={() => setShowIdenterestInfo(false)}
          />

          <View
            className="z-10 w-full max-w-[680px] rounded-3xl border p-6 md:p-7"
            style={{
              backgroundColor,
              borderColor: tintColor + '45',
              maxHeight: 760,
            }}
          >
            <ScrollView
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator
            >
              <View className="mb-3 flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <ThemedText type="defaultSemiBold" className="text-lg md:text-xl">
                    About Identerest Ecosystem
                  </ThemedText>
                </View>

                <Pressable
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  onPress={() => setShowIdenterestInfo(false)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.75 : 1,
                    padding: 4,
                  })}
                >
                  <Ionicons color={secondaryColor} name="close" size={20} />
                </Pressable>
              </View>

              <ThemedText className="opacity-90 text-base leading-6">
                You are creating or signing into your Identerest Account. This shared account works
                across the ecosystem, including this Quantum API dashboard, Creatisphere, and Higher.
              </ThemedText>
              <ThemedText className="mt-2 opacity-80 text-base leading-6">
                Sign in once, then reuse the same identity anywhere Identerest is supported.
              </ThemedText>

              <View className="mt-6 w-full items-center">
                <View className="w-full max-w-[560px]" style={{ height: 308, position: 'relative' }}>
                  <Svg
                    height="100%"
                    preserveAspectRatio="none"
                    style={{ left: 0, position: 'absolute', top: 0 }}
                    viewBox="0 0 100 100"
                    width="100%"
                  >
                    <Line stroke={withAlpha(tintColor, 0.6)} strokeWidth="1.1" x1="50" x2="22.5" y1="43" y2="58" />
                    <Line stroke={withAlpha(tintColor, 0.6)} strokeWidth="1.1" x1="50" x2="77.5" y1="43" y2="58" />
                  </Svg>

                  <View className="absolute left-0 right-0 top-0 items-center">
                    {/* Company Button Component */}
                    <CompanyButton
                      accessibilityLabel="Open Identerest"
                      fontFamily="Emblema One"
                      href="https://identerest.com"
                      imageSource={IDENTEREST_LOGO}
                      name="Identerest"
                      primaryColor={BRAND_COLORS.identerest.primary}
                      secondaryColor={BRAND_COLORS.identerest.secondary}
                    />
                  </View>

                  <View
                    className="absolute bottom-0 left-0 right-0 flex-row justify-between"
                    style={{ bottom: 0, position: 'absolute' }}
                  >
                    {/* Company Button Component */}
                    <CompanyButton
                      accessibilityLabel="Open Creatisphere"
                      fontFamily="Cinzel Decorative-Bold"
                      href="https://creatisphere.app"
                      imageSource={CREATISPHERE_LOGO}
                      name="Creatisphere"
                      primaryColor={BRAND_COLORS.creatisphere.primary}
                      secondaryColor={BRAND_COLORS.creatisphere.secondary}
                    />

                    {/* Company Button Component */}
                    <CompanyButton
                      accessibilityLabel="Open Higher"
                      fontFamily="Playfair Display-Bold"
                      href="https://higher.app"
                      imageSource={HIGHER_LOGO}
                      name="Higher"
                      primaryColor={BRAND_COLORS.higher.primary}
                      secondaryColor={BRAND_COLORS.higher.secondary}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
