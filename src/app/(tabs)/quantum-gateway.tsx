import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { type Session } from '@supabase/supabase-js';
import { type Href, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TabContainer } from '@/components/navigation/TabContainer';
import { CompanyButton } from '@/components/PublicFacing/api/CompanyButton';
import { FormFieldHelpLabel } from '@/components/UI/FormFieldHelpLabel';
import { ThemedText } from '@/components/UI/ThemedText';
import {
  quantumGatewayHighlights,
  quantumGatewayIntegrationNotes,
  quantumGatewayQuickActions,
  quantumGatewaySettingsSections,
} from '@/constants/quantumContent';
import { SITE_URL } from '@/constants/seo';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';
import {
  createQuantumGatewayProject,
  loadQuantumGatewayProjects,
  updateQuantumGatewayProject,
} from '@/services/quantum-gateway-projects';
import type { QuantumGatewayProjectRecord } from '@/types/quantum-gateway';

const IDENTEREST_LOGO = require('~/assets/images/identerest-logo.png');
const CREATISPHERE_LOGO = require('~/assets/images/creatisphere-logo.png');
const HIGHER_LOGO = require('~/assets/images/higher-logo.png');

const BRAND_COLORS = {
  identerest: { primary: '#475569', secondary: '#94a3b8' },
  creatisphere: { primary: '#ff5e00', secondary: '#1058bc' },
  higher: { primary: '#228B22', secondary: '#C3B091' },
} as const;

const GATEWAY_AUTH_PATH = '/quantum-gateway';
const PROJECT_FORM_FADE_OUT_MS = 180;
const PROJECT_FORM_HOLD_MS = 300;
const PROJECT_FORM_COLLAPSE_MS = 460;
const PROJECT_FORM_EXPAND_MS = 320;
const PROJECT_FORM_FADE_IN_MS = 220;
const PROJECT_FORM_FALLBACK_HEIGHT = 420;
const ADD_BUTTON_SLOT_WIDTH = 84;

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const shortenId = (value?: string | null) => {
  if (!value) return 'Not set';
  if (value.length <= 10) return value;
  return `${value.slice(0, 8)}...`;
};

const parseListInput = (rawValue: string) =>
  rawValue
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const slugifyProjectName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const getGatewayAuthRedirectUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${GATEWAY_AUTH_PATH}`;
  }

  return `${SITE_URL}${GATEWAY_AUTH_PATH}`;
};

const decodeOauthError = (rawValue: string | null) => {
  if (!rawValue) return null;
  try {
    return decodeURIComponent(rawValue.replace(/\+/g, ' '));
  } catch {
    return rawValue;
  }
};

type ProjectFormFieldKey =
  | 'displayName'
  | 'projectSlug'
  | 'allowedOrigins';

const PROJECT_FORM_FIELD_HELP: Record<ProjectFormFieldKey, { label: string; help: string }> = {
  displayName: {
    label: 'Project Display Name',
    help: 'Human-readable name shown in your gateway dashboard and project lists.',
  },
  projectSlug: {
    label: 'Project Slug',
    help: 'This is your project URL ID. Base route becomes /gateway/<slug>, so clients and docs use it directly. Keep it short/stable (lowercase + hyphens). Renaming it changes the endpoint path.',
  },
  allowedOrigins: {
    label: 'Allowed Origins',
    help: 'Optional, mainly for browser/web clients (CORS). Use ORIGIN only: scheme + host + optional port. Do NOT include page path, query, or hash. Example: use https://username.itch.io (not https://username.itch.io/game). Local examples: http://localhost:3000, http://127.0.0.1:3000. Mobile native and console games usually leave this blank.',
  },
};

export default function QuantumGatewayPage() {
  const router = useRouter();

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const accentColor = useThemeColor({}, 'accent');
  const backgroundColor = useThemeColor({}, 'background');
  const whiteOrBlackColor = useThemeColor({}, 'whiteOrBlack');
  const secondaryColor = useThemeColor({}, 'secondary');

  const [liveProjects, setLiveProjects] = useState<QuantumGatewayProjectRecord[]>([]);
  const [isSyncingLiveProjects, setIsSyncingLiveProjects] = useState(true);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);
  const [liveSource, setLiveSource] = useState<'supabase' | 'static'>('static');

  const [session, setSession] = useState<Session | null>(null);
  const [bootstrappingAuth, setBootstrappingAuth] = useState(true);
  const [showIdenterestInfo, setShowIdenterestInfo] = useState(false);

  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [startingGithubSignIn, setStartingGithubSignIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [displayNameInput, setDisplayNameInput] = useState('');
  const [projectSlugInput, setProjectSlugInput] = useState('');
  const [allowedOriginsInput, setAllowedOriginsInput] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectMessage, setCreateProjectMessage] = useState<string | null>(null);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [hasEditedSlug, setHasEditedSlug] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(true);
  const [lockProjectFormHeight, setLockProjectFormHeight] = useState(false);
  const [projectFormMeasuredHeight, setProjectFormMeasuredHeight] = useState(0);

  const projectFormOpacity = useSharedValue(1);
  const projectFormSlotHeight = useSharedValue(0);
  const addButtonOpacity = useSharedValue(0);
  const addButtonScale = useSharedValue(0.96);
  const projectFormTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const projectFormOpacityStyle = useAnimatedStyle(() => ({
    opacity: projectFormOpacity.value,
  }));

  const projectFormSlotStyle = useAnimatedStyle(
    () => ({
      height: lockProjectFormHeight ? projectFormSlotHeight.value : undefined,
    }),
    [lockProjectFormHeight]
  );

  const addButtonStyle = useAnimatedStyle(() => ({
    opacity: addButtonOpacity.value,
    transform: [{ scale: addButtonScale.value }],
  }));

  const supabaseClient = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return getSupabaseBrowserClient();
  }, []);

  const syncProjects = useCallback(async () => {
    setIsSyncingLiveProjects(true);
    setLiveSyncMessage(null);

    try {
      const result = await loadQuantumGatewayProjects();
      setLiveProjects(result.projects);
      setLiveSource(result.source);
      setLiveSyncMessage(result.message ?? null);
    } catch (error) {
      setLiveProjects([]);
      setLiveSource('static');
      setLiveSyncMessage(
        error instanceof Error ? error.message : 'Unable to load live gateway projects.'
      );
    } finally {
      setIsSyncingLiveProjects(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!supabaseClient) {
      setSession(null);
      setBootstrappingAuth(false);
      return () => {
        isActive = false;
      };
    }

    const bootstrapSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (!isActive) return;

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session);
      setBootstrappingAuth(false);
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession);
      setAuthError(null);
      setAuthMessage(
        nextSession
          ? 'Signed in with Identerest. You can now create and manage gateway projects.'
          : null
      );
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);
  useEffect(() => {
    void syncProjects();
  }, [syncProjects, session?.access_token]);

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

    const decoded = decodeOauthError(oauthError);
    if (decoded) {
      setAuthError(decoded);
    }
  }, []);

  useEffect(() => {
    if (hasEditedSlug) {
      return;
    }
    setProjectSlugInput(slugifyProjectName(displayNameInput));
  }, [displayNameInput, hasEditedSlug]);

  useEffect(() => {
    if (showProjectForm) {
      addButtonOpacity.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
      addButtonScale.value = withTiming(0.96, { duration: 120, easing: Easing.out(Easing.quad) });
      return;
    }

    addButtonOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
    addButtonScale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [addButtonOpacity, addButtonScale, showProjectForm]);

  const clearProjectFormTimers = useCallback(() => {
    projectFormTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    projectFormTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearProjectFormTimers();
    };
  }, [clearProjectFormTimers]);

  const resetProjectForm = useCallback(() => {
    setDisplayNameInput('');
    setProjectSlugInput('');
    setAllowedOriginsInput('');
    setHasEditedSlug(false);
    setEditingProjectId(null);
    setCreateProjectError(null);
    setCreateProjectMessage(null);
  }, []);

  const handleProjectFormLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.round(event.nativeEvent.layout.height);
      if (nextHeight <= 0) {
        return;
      }

      if (Math.abs(nextHeight - projectFormMeasuredHeight) > 2) {
        setProjectFormMeasuredHeight(nextHeight);
      }
    },
    [projectFormMeasuredHeight]
  );

  const revealProjectForm = useCallback(() => {
    clearProjectFormTimers();

    if (showProjectForm) {
      projectFormOpacity.value = 1;
      return;
    }

    const targetHeight =
      projectFormMeasuredHeight > 0 ? projectFormMeasuredHeight : PROJECT_FORM_FALLBACK_HEIGHT;

    setShowProjectForm(true);
    setLockProjectFormHeight(true);
    projectFormSlotHeight.value = 0;
    projectFormOpacity.value = 0;

    const openTimer = setTimeout(() => {
      projectFormSlotHeight.value = withTiming(targetHeight, {
        duration: PROJECT_FORM_EXPAND_MS,
        easing: Easing.out(Easing.cubic),
      });
      projectFormOpacity.value = withTiming(1, {
        duration: PROJECT_FORM_FADE_IN_MS,
        easing: Easing.out(Easing.quad),
      });

      const unlockTimer = setTimeout(() => {
        setLockProjectFormHeight(false);
      }, PROJECT_FORM_EXPAND_MS);
      projectFormTimersRef.current.push(unlockTimer);
    }, 16);

    projectFormTimersRef.current.push(openTimer);
  }, [
    clearProjectFormTimers,
    projectFormMeasuredHeight,
    projectFormOpacity,
    projectFormSlotHeight,
    showProjectForm,
  ]);

  const runHideProjectFormSequence = useCallback(
    (options?: { reset?: boolean }) => {
      if (!showProjectForm) {
        return;
      }

      clearProjectFormTimers();
      const shouldReset = options?.reset ?? false;
      const measuredHeight =
        projectFormMeasuredHeight > 0 ? projectFormMeasuredHeight : PROJECT_FORM_FALLBACK_HEIGHT;

      setLockProjectFormHeight(true);
      projectFormSlotHeight.value = measuredHeight;
      projectFormOpacity.value = withTiming(0, {
        duration: PROJECT_FORM_FADE_OUT_MS,
        easing: Easing.out(Easing.quad),
      });

      const collapseTimer = setTimeout(() => {
        projectFormSlotHeight.value = withTiming(
          0,
          {
            duration: PROJECT_FORM_COLLAPSE_MS,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (!finished) {
              return;
            }

            runOnJS(() => {
              setShowProjectForm(false);
              setLockProjectFormHeight(false);
              projectFormOpacity.value = 1;
              if (shouldReset) {
                resetProjectForm();
              }
            })();
          }
        );
      }, PROJECT_FORM_FADE_OUT_MS + PROJECT_FORM_HOLD_MS);

      projectFormTimersRef.current.push(collapseTimer);
    },
    [
      clearProjectFormTimers,
      projectFormMeasuredHeight,
      projectFormOpacity,
      projectFormSlotHeight,
      resetProjectForm,
      showProjectForm,
    ]
  );

  const handleStartCreateProject = useCallback(() => {
    resetProjectForm();
    revealProjectForm();
  }, [resetProjectForm, revealProjectForm]);

  const handleStartEditProject = useCallback((project: QuantumGatewayProjectRecord) => {
    revealProjectForm();
    setDisplayNameInput(project.displayName);
    setProjectSlugInput(project.projectSlug);
    setAllowedOriginsInput(project.allowedOrigins.join(', '));
    setHasEditedSlug(true);
    setEditingProjectId(project.id);
    setCreateProjectError(null);
    setCreateProjectMessage(null);
  }, [revealProjectForm]);

  const handleDismissProjectForm = useCallback(() => {
    if (creatingProject) {
      return;
    }
    runHideProjectFormSequence({ reset: true });
  }, [creatingProject, runHideProjectFormSequence]);

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
        options: { emailRedirectTo: getGatewayAuthRedirectUrl() },
      });

      if (error) {
        throw error;
      }

      setAuthMessage(
        `Magic link sent to ${normalizedEmail}. Open it in this browser to finish sign in.`
      );
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
        options: { redirectTo: getGatewayAuthRedirectUrl() },
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

      clearProjectFormTimers();
      setSession(null);
      setAuthMessage('Signed out from Identerest.');
      setCreateProjectError(null);
      setCreateProjectMessage(null);
      setEditingProjectId(null);
      setShowProjectForm(true);
      setLockProjectFormHeight(false);
      projectFormOpacity.value = 1;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setSigningOut(false);
    }
  }, [clearProjectFormTimers, projectFormOpacity, supabaseClient]);

  const handleSaveGatewayProject = useCallback(async () => {
    if (!session?.user?.id) {
      setCreateProjectError('Sign in with Identerest to manage gateway projects.');
      return;
    }

    const displayName = displayNameInput.trim();
    const projectSlug = slugifyProjectName(projectSlugInput);
    const endpointPathPrefix = projectSlug ? `/gateway/${projectSlug}` : '/gateway';

    if (!displayName) {
      setCreateProjectError('Project display name is required.');
      return;
    }
    if (!projectSlug) {
      setCreateProjectError('Project slug is required. Use lowercase letters, numbers, and hyphens.');
      return;
    }

    setCreatingProject(true);
    setCreateProjectError(null);
    setCreateProjectMessage(null);

    try {
      if (editingProjectId) {
        const updatedProject = await updateQuantumGatewayProject({
          id: editingProjectId,
          ownerUserId: session.user.id,
          displayName,
          projectSlug,
          endpointPathPrefix,
          allowedOrigins: parseListInput(allowedOriginsInput),
        });

        setCreateProjectMessage(
          `Updated gateway project "${updatedProject.displayName}" at ${updatedProject.endpointPathPrefix}.`
        );
      } else {
        const createdProject = await createQuantumGatewayProject({
          ownerUserId: session.user.id,
          displayName,
          projectSlug,
          endpointPathPrefix,
          allowedOrigins: parseListInput(allowedOriginsInput),
        });

        setCreateProjectMessage(
          `Created gateway project "${createdProject.displayName}" at ${createdProject.endpointPathPrefix}.`
        );
      }

      await syncProjects();
      runHideProjectFormSequence({ reset: true });
    } catch (error) {
      setCreateProjectError(
        error instanceof Error ? error.message : 'Unable to save gateway project.'
      );
    } finally {
      setCreatingProject(false);
    }
  }, [
    allowedOriginsInput,
    displayNameInput,
    editingProjectId,
    projectSlugInput,
    runHideProjectFormSequence,
    session?.user?.id,
    syncProjects,
  ]);

  const isEditingProject = editingProjectId !== null;

  const primaryProject = liveProjects[0] ?? null;
  const activeProjectCount = useMemo(
    () => liveProjects.filter((project) => project.status === 'active').length,
    [liveProjects]
  );

  const runtimeHighlights = useMemo(() => {
    const loadedCount = liveProjects.length;
    if (loadedCount === 0) return quantumGatewayHighlights;

    return quantumGatewayHighlights.map((item) => {
      if (item.id !== 'usage') {
        return item;
      }

      const label = loadedCount === 1 ? 'project' : 'projects';
      return {
        ...item,
        description: `${loadedCount} live gateway ${label} loaded from Identerest with ${activeProjectCount} currently active.`,
        status: liveSource === 'supabase' ? 'Live sync from Identerest' : item.status,
      };
    });
  }, [activeProjectCount, liveProjects.length, liveSource]);

  const runtimeSettingsSections = useMemo(() => {
    if (!primaryProject) {
      return quantumGatewaySettingsSections;
    }

    return quantumGatewaySettingsSections.map((section) => {
      if (section.id === 'routing') {
        return {
          ...section,
          rows: section.rows.map((row) => {
            if (row.id === 'slug') {
              return {
                ...row,
                value: primaryProject.projectSlug,
              };
            }
            if (row.id === 'path-prefix') {
              return {
                ...row,
                value: primaryProject.endpointPathPrefix,
              };
            }
            if (row.id === 'status') {
              return {
                ...row,
                value: primaryProject.status,
              };
            }
            return row;
          }),
        };
      }

      if (section.id === 'limits') {
        return {
          ...section,
          rows: section.rows.map((row) => {
            if (row.id === 'rpm') {
              return {
                ...row,
                value: `${primaryProject.defaultRateLimitPerMinute} requests/min`,
              };
            }
            if (row.id === 'daily') {
              return {
                ...row,
                value: `${primaryProject.dailyRequestQuota} requests/day`,
              };
            }
            if (row.id === 'origins') {
              return {
                ...row,
                value:
                  primaryProject.allowedOrigins.length > 0
                    ? `${primaryProject.allowedOrigins.length} configured origins`
                    : 'No origins configured',
              };
            }
            return row;
          }),
        };
      }

      if (section.id === 'credentials') {
        return {
          ...section,
          rows: section.rows.map((row) => {
            if (row.id === 'primary-api-key') {
              return {
                ...row,
                value: shortenId(primaryProject.defaultApiKeyId),
              };
            }
            if (row.id === 'ibm-default') {
              return {
                ...row,
                value: shortenId(primaryProject.defaultIbmCredentialProfileId),
              };
            }
            return row;
          }),
        };
      }

      return section;
    });
  }, [primaryProject]);

  const liveSyncBody = (
    <Animated.View className="gap-3 overflow-hidden">
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
            {getSupabaseConfigError()} Add `EXPO_PUBLIC_SUPABASE_URL` and
            ` EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable Identerest Account sign in and live
            gateway project creation on this page.
          </ThemedText>
        </View>
      ) : bootstrappingAuth ? (
        <View className="rounded-2xl p-5" style={{ backgroundColor: backgroundColor }}>
          <ActivityIndicator color={tintColor} />
          <ThemedText className="mt-3 text-center opacity-80">
            Restoring your Identerest session...
          </ThemedText>
        </View>
      ) : !session ? (
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: backgroundColor,
            borderColor: accentColor + '35',
          }}
        >
          <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
            Sign in with Identerest to start managing projects.
          </ThemedText>
          <ThemedText className="mb-4 opacity-80 text-base leading-6">
            Live project creation happens here. Use a passwordless email magic link or continue
            with GitHub.
          </ThemedText>

          {authError ? (
            <View
              className="mb-3 rounded-2xl border px-4 py-3"
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
              className="mb-3 rounded-2xl border px-4 py-3"
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
                onPress={() => {
                  void handleMagicLink();
                }}
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
                onPress={() => {
                  void handleGithubSignIn();
                }}
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
        <View className="gap-3">
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: backgroundColor,
              borderColor: accentColor + '35',
            }}
          >
            <View className="mb-3 flex-row flex-wrap items-start justify-between gap-3">
              <View className="flex-1">
                <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                  Signed in via Identerest Account
                </ThemedText>
                <ThemedText selectable className="opacity-80 text-base leading-6">
                  {session.user.email ?? 'Authenticated Quantum Gateway user'}
                </ThemedText>
              </View>

              <Pressable
                disabled={signingOut}
                onPress={() => {
                  void handleSignOut();
                }}
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
                  <ThemedText
                    className="font-bold text-sm uppercase tracking-[0.16em]"
                    style={{ color: secondaryColor }}
                  >
                    Sign out
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {showProjectForm ? (
              <Animated.View
                style={[lockProjectFormHeight ? { overflow: 'hidden' } : null, projectFormSlotStyle]}
              >
                <Animated.View
                  className="gap-3"
                  onLayout={handleProjectFormLayout}
                  style={projectFormOpacityStyle}
                >
                <View className="flex-row items-center justify-between">
                  <ThemedText type="defaultSemiBold" className="text-lg">
                    {isEditingProject ? 'Edit Gateway Project' : 'Create Gateway Project'}
                  </ThemedText>
                  <View className="flex-row items-center gap-2">
                    {isEditingProject ? (
                      <Pressable
                        accessibilityLabel="Cancel editing gateway project"
                        onPress={handleStartCreateProject}
                        style={({ pressed }) => ({
                          backgroundColor: accentColor + '18',
                          borderCurve: 'continuous',
                          borderRadius: 12,
                          opacity: pressed ? 0.72 : 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        })}
                      >
                        <ThemedText
                          className="font-semibold text-sm"
                          style={{ color: secondaryColor }}
                        >
                          Cancel Edit
                        </ThemedText>
                      </Pressable>
                    ) : null}
                    <Pressable
                      accessibilityLabel="Hide gateway project form"
                      onPress={handleDismissProjectForm}
                      style={({ pressed }) => ({
                        alignItems: 'center',
                        backgroundColor: accentColor + '16',
                        borderCurve: 'continuous',
                        borderRadius: 12,
                        justifyContent: 'center',
                        opacity: pressed ? 0.72 : 1,
                        padding: 8,
                      })}
                    >
                      <Ionicons color={secondaryColor} name="close" size={16} />
                    </Pressable>
                  </View>
                </View>

                <View>
                  <FormFieldHelpLabel
                    helpText={PROJECT_FORM_FIELD_HELP.displayName.help}
                    label={PROJECT_FORM_FIELD_HELP.displayName.label}
                    required
                  />
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={(value) => {
                      setDisplayNameInput(value);
                      setCreateProjectError(null);
                      setCreateProjectMessage(null);
                    }}
                    placeholder="Project display name"
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
                    value={displayNameInput}
                  />
                </View>

                <View>
                  <FormFieldHelpLabel
                    helpText={PROJECT_FORM_FIELD_HELP.projectSlug.help}
                    label={PROJECT_FORM_FIELD_HELP.projectSlug.label}
                    required
                  />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(value) => {
                      setHasEditedSlug(true);
                      setProjectSlugInput(value);
                      setCreateProjectError(null);
                      setCreateProjectMessage(null);
                    }}
                    placeholder="project-slug"
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
                    value={projectSlugInput}
                  />
                </View>

                <View>
                  <FormFieldHelpLabel
                    helpText={PROJECT_FORM_FIELD_HELP.allowedOrigins.help}
                    label={PROJECT_FORM_FIELD_HELP.allowedOrigins.label}
                  />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    numberOfLines={2}
                    onChangeText={(value) => {
                      setAllowedOriginsInput(value);
                      setCreateProjectError(null);
                      setCreateProjectMessage(null);
                    }}
                    placeholder="Allowed origins (comma/newline separated, optional)"
                    placeholderTextColor={textColor + '70'}
                    style={{
                      backgroundColor: accentColor + '12',
                      borderColor: tintColor + '30',
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      borderWidth: 1,
                      color: textColor,
                      fontSize: 15,
                      minHeight: 84,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      textAlignVertical: 'top',
                    }}
                    value={allowedOriginsInput}
                  />
                </View>

                <Pressable
                  disabled={creatingProject}
                  onPress={() => {
                    void handleSaveGatewayProject();
                  }}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: tintColor,
                    borderCurve: 'continuous',
                    borderRadius: 16,
                    flexDirection: 'row',
                    gap: 10,
                    justifyContent: 'center',
                    opacity: pressed || creatingProject ? 0.72 : 1,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  })}
                >
                  {creatingProject ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        color="#fff"
                        name={isEditingProject ? 'create-outline' : 'add-circle-outline'}
                        size={18}
                      />
                      <ThemedText inverse className="font-bold text-base">
                        {isEditingProject ? 'Save Project Changes' : 'Create Gateway Project'}
                      </ThemedText>
                    </>
                  )}
                </Pressable>

                {createProjectError ? (
                  <View
                    className="mt-1 rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: '#ef444418',
                      borderColor: '#ef444455',
                    }}
                  >
                    <ThemedText className="text-base leading-6" style={{ color: '#f87171' }}>
                      {createProjectError}
                    </ThemedText>
                  </View>
                ) : null}

                {createProjectMessage ? (
                  <View
                    className="mt-1 rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: tintColor + '16',
                      borderColor: tintColor + '40',
                    }}
                  >
                    <ThemedText className="text-base leading-6">{createProjectMessage}</ThemedText>
                  </View>
                ) : null}
                </Animated.View>
              </Animated.View>
            ) : null}
          </View>

          <Animated.View
            className="rounded-2xl border p-4"
            style={[
              {
                backgroundColor: backgroundColor,
                borderColor: accentColor + '35',
              },
            ]}
          >
            <View className="mb-2 flex-row items-center justify-between gap-2">
              <ThemedText type="defaultSemiBold" className="text-lg">
                Synced gateway projects
              </ThemedText>
              <View
                style={{
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  minHeight: 34,
                  width: ADD_BUTTON_SLOT_WIDTH,
                }}
              >
                <Animated.View style={addButtonStyle}>
                  <Pressable
                    accessibilityLabel="Add gateway project"
                    disabled={showProjectForm}
                    onPress={handleStartCreateProject}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      borderColor: '#ffffffcc',
                      borderCurve: 'continuous',
                      borderRadius: 12,
                      borderWidth: 1,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      opacity: pressed || showProjectForm ? 0.78 : 1,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    })}
                  >
                    <Ionicons color="#475569" name="add" size={14} />
                    <ThemedText
                      className="text-xs font-bold tracking-[0.06em]"
                      style={{ color: '#475569' }}
                    >
                      ADD
                    </ThemedText>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
            {liveProjects.length === 0 ? (
              <View
                className="rounded-xl border border-dashed px-3 py-3"
                style={{
                  backgroundColor: accentColor + '0f',
                  borderColor: tintColor + '33',
                }}
              >
                <ThemedText className="opacity-85">
                  {showProjectForm
                    ? 'No gateway projects yet. Create your first one with the form above.'
                    : 'No gateway projects yet. Click Add to open the project form.'}
                </ThemedText>
              </View>
            ) : (
              <View>
                <ThemedText className="opacity-90 mb-2">
                  {liveProjects.length} projects loaded, {activeProjectCount} active.
                </ThemedText>
                {liveProjects.slice(0, 4).map((project) => (
                  <View
                    key={project.id}
                    className="mb-2 rounded-xl border border-white/10 px-3 py-2"
                    style={{ backgroundColor: hexToRgba(backgroundColor, 0.2) }}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <ThemedText className="font-semibold">{project.displayName}</ThemedText>
                        <ThemedText className="opacity-80 text-sm">
                          /{project.projectSlug} - {project.status}
                        </ThemedText>
                      </View>
                      <Pressable
                        accessibilityLabel={`Edit ${project.displayName}`}
                        onPress={() => handleStartEditProject(project)}
                        style={({ pressed }) => ({
                          alignItems: 'center',
                          backgroundColor: '#ffffff',
                          borderColor: '#ffffffcc',
                          borderCurve: 'continuous',
                          borderRadius: 10,
                          borderWidth: 1,
                          flexDirection: 'row',
                          gap: 6,
                          justifyContent: 'center',
                          opacity: pressed ? 0.78 : 1,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                        })}
                      >
                        <Ionicons color="#475569" name="create-outline" size={14} />
                        <ThemedText
                          className="text-xs font-bold tracking-[0.06em]"
                          style={{ color: '#475569' }}
                        >
                          EDIT
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {liveSyncMessage ? (
              <ThemedText className="opacity-75 text-sm mt-2">{liveSyncMessage}</ThemedText>
            ) : null}
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );

  return (
    <TabContainer
      titleA="Quantum"
      titleB="Gateway"
      leadBody="This page is the gateway display and settings hub. Users can keep one Identerest sign-in while reusing Quantum API keys and IBM credential profiles for gateway-managed projects."
      leadSubBody="Initial UI is now wired and styled to match the rest of your site, with identerest schema focused on gateway project settings and default credential references."
      seo={{
        title: 'Quantum Gateway',
        description:
          'Quantum Gateway settings and landing page for project routing, key/profile bindings, and usage controls tied to one Identerest account.',
        path: '/quantum-gateway',
        keywords: [
          'quantum gateway',
          'quantum api',
          'ibm credentials',
          'project settings',
          'api gateway',
          'identerest',
        ],
        type: 'website',
      }}
    >
      <View className="w-full max-w-[1080px]">
        <View
          className="rounded-3xl border border-white/10 p-[4%] mb-4"
          style={{
            backgroundColor: hexToRgba(accentColor, 0.58),
          }}
        >
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-3">
            <View className="flex-row items-center">
              <Ionicons name="cloud-done-outline" size={20} color={tintColor} />
              <ThemedText className="ml-2 font-bold text-lg">Live Identerest sync</ThemedText>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityLabel="Refresh gateway projects"
                onPress={() => {
                  void syncProjects();
                }}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderColor: '#ffffffcc',
                  borderCurve: 'continuous',
                  borderRadius: 12,
                  borderWidth: 1,
                  justifyContent: 'center',
                  opacity: pressed || isSyncingLiveProjects ? 0.78 : 1,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                })}
              >
                {isSyncingLiveProjects ? (
                  <ActivityIndicator color="#475569" />
                ) : (
                  <Ionicons color="#475569" name="refresh" size={16} />
                )}
              </Pressable>

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
          </View>

          {liveSyncBody}
        </View>

        <View
          className="rounded-3xl border border-white/10 p-[4%] mb-4"
          style={{
            backgroundColor: hexToRgba(accentColor, 0.72),
          }}
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-3"
              style={{ backgroundColor: hexToRgba(tintColor, 0.2) }}
            >
              <Ionicons name="shield-checkmark-outline" size={28} color={tintColor} />
            </View>

            <View className="flex-1">
              <ThemedText headingLevel={1} visualHeadingLevel={2} className="font-bold">
                Gateway Portal Overview
              </ThemedText>
              <ThemedText className="opacity-85">
                One account identity, shared credentials, project-level controls.
              </ThemedText>
            </View>
          </View>

          <ThemedText className="leading-6 opacity-90 mb-3">
            Users do not need separate accounts across Quantum API, Gateway, Identerest,
            Creatisphere, or Higher. This UI is organized around that single-account model and the
            existing credential records already stored in Identerest.
          </ThemedText>

          <View className="gap-2">
            {quantumGatewayIntegrationNotes.slice(0, 2).map((note) => (
              <View key={note} className="flex-row items-start">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={tintColor}
                  style={{ marginTop: 2 }}
                />
                <ThemedText className="ml-2 flex-1 opacity-90">{note}</ThemedText>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-4">
            {quantumGatewayQuickActions.map((action) => (
              <Pressable
                key={action.id}
                className="px-3 py-2 rounded-xl border"
                style={{
                  borderColor: hexToRgba(tintColor, 0.35),
                  backgroundColor: hexToRgba(backgroundColor, 0.45),
                }}
                onPress={() => router.push(action.route as Href)}
              >
                <View className="flex-row items-center">
                  <Ionicons name={action.icon as any} size={16} color={textColor} />
                  <ThemedText className="ml-2 font-semibold">{action.label}</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <ThemedText type="subtitle" className="mb-3 text-2xl font-bold">
            What users can manage
          </ThemedText>

          <View className="gap-3">
            {runtimeHighlights.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-white/10 p-4"
                style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons name={item.icon as any} size={20} color={tintColor} />
                  <ThemedText className="ml-2 font-bold text-lg">{item.title}</ThemedText>
                </View>
                <ThemedText className="opacity-90 leading-6 mb-2">{item.description}</ThemedText>
                <View
                  className="self-start px-2 py-1 rounded-lg"
                  style={{ backgroundColor: hexToRgba(tintColor, 0.2) }}
                >
                  <ThemedText className="text-sm font-semibold">{item.status}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <ThemedText type="subtitle" className="mb-3 text-2xl font-bold">
            Settings preview
          </ThemedText>

          <View className="gap-3">
            {runtimeSettingsSections.map((section) => (
              <View
                key={section.id}
                className="rounded-2xl border border-white/10 p-4"
                style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
              >
                <ThemedText className="font-bold text-xl mb-1">{section.title}</ThemedText>
                <ThemedText className="opacity-85 mb-3">{section.description}</ThemedText>

                <View className="rounded-xl overflow-hidden border border-white/10">
                  {section.rows.map((row, index) => (
                    <View
                      key={row.id}
                      className="px-3 py-2"
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? hexToRgba(backgroundColor, 0.2) : 'transparent',
                      }}
                    >
                      <View className="flex-row items-start justify-between">
                        <ThemedText className="font-semibold flex-1 mr-3">{row.label}</ThemedText>
                        <ThemedText className="font-semibold">{row.value}</ThemedText>
                      </View>
                      {row.hint ? (
                        <ThemedText className="opacity-75 text-sm mt-1">{row.hint}</ThemedText>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View
          className="rounded-2xl border border-white/10 p-4"
          style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
        >
          <ThemedText type="subtitle" className="mb-3 text-xl font-bold">
            Data flow model
          </ThemedText>

          <View className="gap-2">
            {quantumGatewayIntegrationNotes.map((note, index) => (
              <View key={note} className="flex-row items-start">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: hexToRgba(tintColor, 0.22) }}
                >
                  <ThemedText className="text-xs font-bold" style={{ color: whiteOrBlackColor }}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText className="flex-1 leading-6">{note}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

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
            <ScrollView contentContainerStyle={{ paddingBottom: 4 }} showsVerticalScrollIndicator>
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
                Identerest is your shared account identity for Quantum API and Quantum Gateway.
                Sign in once and manage projects here without creating a second account.
              </ThemedText>
              <ThemedText className="mt-2 opacity-80 text-base leading-6">
                The same Identerest account also works across Creatisphere and Higher.
              </ThemedText>

              <View className="mt-6 w-full items-center">
                <View className="w-full max-w-[560px]" style={{ height: 308, position: 'relative' }}>
                  <View className="absolute left-0 right-0 top-0 items-center">
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

                  <View className="absolute bottom-0 left-0 right-0 flex-row justify-between">
                    <CompanyButton
                      accessibilityLabel="Open Creatisphere"
                      fontFamily="Cinzel Decorative-Bold"
                      href="https://creatisphere.app"
                      imageSource={CREATISPHERE_LOGO}
                      name="Creatisphere"
                      primaryColor={BRAND_COLORS.creatisphere.primary}
                      secondaryColor={BRAND_COLORS.creatisphere.secondary}
                    />

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
    </TabContainer>
  );
}
