import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { TabContainer } from '@/components/navigation/TabContainer';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getQuantumAuthRedirectUrl,
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from '@/lib/supabase-browser';
import { QUANTUM_API_BASE_URL, QUANTUM_GATEWAY_BASE_URL, QUANTUM_GATEWAY_DOCS_URL } from '@/lib/quantum-api-config';
import {
  createQuantumGatewayPublishableKey,
  listQuantumGatewayPublishableKeys,
  loadQuantumGatewayProjects,
  mintGatewayRuntimeSession,
  revokeQuantumGatewayPublishableKey,
  rotateQuantumGatewayPublishableKey,
  saveQuantumGatewayProject,
  toQuantumGatewayUserMessage,
  updateQuantumGatewayProject,
} from '@/services/quantum-gateway-projects';
import {
  listIbmProfiles,
  listQuantumKeys,
  type IbmProfileRecord,
  type QuantumKeyRecord,
  QuantumApiError,
} from '@/services/quantum-key-management';
import type {
  QuantumGatewayProjectInput,
  QuantumGatewayProjectRecord,
  QuantumGatewayProjectStatus,
  QuantumGatewayPublishableKeyRecord,
  QuantumGatewayRuntimeSessionResult,
} from '@/types/quantum-gateway';

type GatewayProjectFormState = {
  projectSlug: string;
  displayName: string;
  status: QuantumGatewayProjectStatus;
  endpointPathPrefix: string;
  defaultApiKeyId: string;
  defaultIbmCredentialProfileId: string;
  routeAllowlistText: string;
  defaultRateLimitPerMinute: string;
  dailyRequestQuota: string;
  allowedOriginsText: string;
};

type PublishableKeyReveal = {
  action: 'created' | 'rotated';
  label: string;
  rawKey: string;
};

type RuntimeTokenReveal = {
  token: string;
  expiresAt?: string | null;
  projectId?: string | null;
};

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
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const splitListInput = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const joinListInput = (value: string[]) => value.join('\n');

const createEmptyProjectForm = (): GatewayProjectFormState => ({
  projectSlug: '',
  displayName: '',
  status: 'active',
  endpointPathPrefix: '/public-facing/api/quantum-gateway/v1',
  defaultApiKeyId: '',
  defaultIbmCredentialProfileId: '',
  routeAllowlistText: '/v1/health\n/v1/gates/run',
  defaultRateLimitPerMinute: '120',
  dailyRequestQuota: '100000',
  allowedOriginsText: 'http://localhost:3000\nhttp://127.0.0.1:3000',
});

async function copyToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  await Clipboard.setStringAsync(value);
}

function confirmAction(message: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert('Confirm', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function projectToForm(project: QuantumGatewayProjectRecord): GatewayProjectFormState {
  return {
    projectSlug: project.projectSlug,
    displayName: project.displayName,
    status: project.status,
    endpointPathPrefix: project.endpointPathPrefix,
    defaultApiKeyId: project.defaultApiKeyId ?? '',
    defaultIbmCredentialProfileId: project.defaultIbmCredentialProfileId ?? '',
    routeAllowlistText: joinListInput(project.routeAllowlist),
    defaultRateLimitPerMinute: String(project.defaultRateLimitPerMinute),
    dailyRequestQuota: String(project.dailyRequestQuota),
    allowedOriginsText: joinListInput(project.allowedOrigins),
  };
}

function buildProjectInput(form: GatewayProjectFormState): QuantumGatewayProjectInput {
  return {
    projectSlug: form.projectSlug.trim(),
    displayName: form.displayName.trim(),
    status: form.status,
    endpointPathPrefix: form.endpointPathPrefix.trim(),
    defaultApiKeyId: form.defaultApiKeyId.trim() || null,
    defaultIbmCredentialProfileId: form.defaultIbmCredentialProfileId.trim() || null,
    routeAllowlist: splitListInput(form.routeAllowlistText),
    defaultRateLimitPerMinute: Number(form.defaultRateLimitPerMinute) || 120,
    dailyRequestQuota: Number(form.dailyRequestQuota) || 100000,
    allowedOrigins: splitListInput(form.allowedOriginsText),
  };
}

function useSelectedProject(
  projects: QuantumGatewayProjectRecord[],
  selectedProjectSlug: string | null
) {
  return useMemo(
    () => projects.find((project) => project.projectSlug === selectedProjectSlug) ?? projects[0] ?? null,
    [projects, selectedProjectSlug]
  );
}

export default function QuantumGatewayPage() {
  const isWeb = Platform.OS === 'web';
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');
  const whiteOrBlackColor = useThemeColor({}, 'whiteOrBlack');
  const isPickerWeb = isWeb;
  const pickerBackgroundColor = isPickerWeb ? '#ffffff' : accentColor + '12';
  const pickerTextColor = isPickerWeb ? '#11181C' : textColor;
  const pickerBorderColor = isPickerWeb ? '#9ca3af' : tintColor + '30';
  const supabaseClient = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    return getSupabaseBrowserClient();
  }, []);

  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [startingGithubSignIn, setStartingGithubSignIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [projects, setProjects] = useState<QuantumGatewayProjectRecord[]>([]);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const [editingProjectSlug, setEditingProjectSlug] = useState<string | null>(null);
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  const [availableQuantumKeys, setAvailableQuantumKeys] = useState<QuantumKeyRecord[]>([]);
  const [availableIbmProfiles, setAvailableIbmProfiles] = useState<IbmProfileRecord[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [credentialsMessage, setCredentialsMessage] = useState<string | null>(null);

  const [publishableKeys, setPublishableKeys] = useState<QuantumGatewayPublishableKeyRecord[]>([]);
  const [loadingPublishableKeys, setLoadingPublishableKeys] = useState(false);
  const [publishableKeyLabel, setPublishableKeyLabel] = useState('');
  const [publishableKeyError, setPublishableKeyError] = useState<string | null>(null);
  const [publishableKeyMessage, setPublishableKeyMessage] = useState<string | null>(null);
  const [creatingPublishableKey, setCreatingPublishableKey] = useState(false);
  const [busyPublishableKeyId, setBusyPublishableKeyId] = useState<string | null>(null);
  const [publishableKeyReveal, setPublishableKeyReveal] = useState<PublishableKeyReveal | null>(
    null
  );

  const [runtimePublishableKey, setRuntimePublishableKey] = useState('');
  const [runtimeSessionResult, setRuntimeSessionResult] = useState<RuntimeTokenReveal | null>(null);
  const [mintingRuntimeSession, setMintingRuntimeSession] = useState(false);
  const [runtimeSessionError, setRuntimeSessionError] = useState<string | null>(null);

  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;
  const selectedProject = useSelectedProject(projects, selectedProjectSlug);
  const activeProjectCount = useMemo(
    () => projects.filter((project) => project.status === 'active').length,
    [projects]
  );

  const refreshProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectError(null);

    try {
      const result = await loadQuantumGatewayProjects(QUANTUM_GATEWAY_BASE_URL, accessToken);
      setProjects(result.projects);
      if (result.requiresAuth) {
        setProjectMessage(result.message ?? 'Sign in to load gateway projects.');
      } else {
        setProjectMessage(result.message ?? null);
      }
    } catch (error) {
      setProjects([]);
      setProjectMessage(null);
      setProjectError(
        error instanceof Error ? error.message : 'Unable to load gateway projects right now.'
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [accessToken]);

  const refreshCredentialOptions = useCallback(async () => {
    if (!accessToken) {
      setAvailableQuantumKeys([]);
      setAvailableIbmProfiles([]);
      setCredentialsMessage(null);
      setLoadingCredentials(false);
      return;
    }

    setLoadingCredentials(true);
    setCredentialsMessage(null);

    const [keysResult, profilesResult] = await Promise.allSettled([
      listQuantumKeys(QUANTUM_API_BASE_URL, accessToken),
      listIbmProfiles(QUANTUM_API_BASE_URL, accessToken),
    ]);

    if (keysResult.status === 'fulfilled') {
      setAvailableQuantumKeys(keysResult.value);
    } else {
      setAvailableQuantumKeys([]);
    }

    if (profilesResult.status === 'fulfilled') {
      setAvailableIbmProfiles(profilesResult.value);
    } else {
      setAvailableIbmProfiles([]);
    }

    const messages = [
      keysResult.status === 'rejected'
        ? keysResult.reason instanceof QuantumApiError
          ? keysResult.reason.message
          : 'Unable to load Quantum API keys.'
        : null,
      profilesResult.status === 'rejected'
        ? profilesResult.reason instanceof Error
          ? profilesResult.reason.message
          : 'Unable to load IBM profiles.'
        : null,
    ].filter((value): value is string => Boolean(value));

    setCredentialsMessage(messages.length > 0 ? messages.join(' ') : null);
    setLoadingCredentials(false);
  }, [accessToken]);

  const refreshPublishableKeys = useCallback(
    async (projectSlug: string | null) => {
      if (!accessToken || !projectSlug) {
        setPublishableKeys([]);
        return;
      }

      setLoadingPublishableKeys(true);
      setPublishableKeyError(null);

      try {
        const keys = await listQuantumGatewayPublishableKeys(
          QUANTUM_GATEWAY_BASE_URL,
          accessToken,
          projectSlug
        );
        setPublishableKeys(keys);
      } catch (error) {
        setPublishableKeys([]);
        setPublishableKeyError(
          error instanceof Error ? error.message : 'Unable to load publishable keys.'
        );
      } finally {
        setLoadingPublishableKeys(false);
      }
    },
    [accessToken]
  );

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
      setProjects([]);
      setAvailableQuantumKeys([]);
      setAvailableIbmProfiles([]);
      setPublishableKeys([]);
      setSelectedProjectSlug(null);
      setEditingProjectSlug(null);
      setIsCreatingNewProject(false);
      setProjectForm(createEmptyProjectForm());
      setLoadingProjects(false);
      setLoadingCredentials(false);
      setLoadingPublishableKeys(false);
      setProjectMessage(null);
      setProjectError(null);
      setCredentialsMessage(null);
      setPublishableKeyError(null);
      setPublishableKeyMessage(null);
      setPublishableKeyReveal(null);
      setRuntimeSessionError(null);
      setRuntimeSessionResult(null);
      return;
    }

    refreshProjects();
    refreshCredentialOptions();
  }, [accessToken, refreshCredentialOptions, refreshProjects]);

  useEffect(() => {
    if (!selectedProject) {
      setPublishableKeys([]);
      return;
    }

    if (selectedProjectSlug !== selectedProject.projectSlug) {
      setSelectedProjectSlug(selectedProject.projectSlug);
    }

    if (editingProjectSlug === null && !isCreatingNewProject && !projectForm.projectSlug) {
      setProjectForm(projectToForm(selectedProject));
    }

    refreshPublishableKeys(selectedProject.projectSlug);
  }, [
    editingProjectSlug,
    isCreatingNewProject,
    projectForm.projectSlug,
    refreshPublishableKeys,
    selectedProject,
    selectedProjectSlug,
  ]);

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
      setAuthError('Enter an email address to receive an Identerest sign-in link.');
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
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setSigningOut(false);
    }
  }, [supabaseClient]);

  const handleSelectProject = useCallback(
    (project: QuantumGatewayProjectRecord) => {
    setSelectedProjectSlug(project.projectSlug);
    setEditingProjectSlug(project.projectSlug);
    setIsCreatingNewProject(false);
    setProjectForm(projectToForm(project));
      setProjectMessage(`Editing gateway project "${project.displayName}".`);
      setProjectError(null);
    },
    []
  );

  const handleNewProject = useCallback(() => {
    setEditingProjectSlug(null);
    setIsCreatingNewProject(true);
    setProjectForm(createEmptyProjectForm());
    setProjectMessage('Create a new Gateway project for this Identerest account.');
    setProjectError(null);
  }, []);

  const handleProjectField = useCallback(
    (field: keyof GatewayProjectFormState, value: string) => {
      setProjectForm((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const handleSaveProject = useCallback(async () => {
    if (!accessToken) return;

    const payload = buildProjectInput(projectForm);
    if (!payload.projectSlug) {
      setProjectError('Project slug is required.');
      return;
    }
    if (!payload.displayName) {
      setProjectError('Display name is required.');
      return;
    }
    if (!payload.endpointPathPrefix) {
      setProjectError('Endpoint path prefix is required.');
      return;
    }

    setSavingProject(true);
    setProjectError(null);
    setProjectMessage(null);

    try {
      const result = editingProjectSlug
        ? await updateQuantumGatewayProject(
            QUANTUM_GATEWAY_BASE_URL,
            accessToken,
            editingProjectSlug,
            payload
          )
        : await saveQuantumGatewayProject(QUANTUM_GATEWAY_BASE_URL, accessToken, payload);

      if (!result.project) {
        throw new Error('The gateway API saved the project, but no project record was returned.');
      }

      const savedProject = result.project;
      setProjectMessage(
        result.message ??
          `Saved gateway project "${savedProject.displayName}".`
      );
      setEditingProjectSlug(savedProject.projectSlug);
      setIsCreatingNewProject(false);
      setSelectedProjectSlug(savedProject.projectSlug);
      setProjectForm(projectToForm(savedProject));
      await refreshProjects();
    } catch (error) {
      setProjectError(toQuantumGatewayUserMessage(error));
    } finally {
      setSavingProject(false);
    }
  }, [accessToken, editingProjectSlug, projectForm, refreshProjects]);

  const handleCopy = useCallback(async (value: string, key: string) => {
    try {
      await copyToClipboard(value);
      setCopiedValue(key);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(
        () => setCopiedValue((current) => (current === key ? null : current)),
        1800
      );
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Unable to copy to clipboard.');
    }
  }, []);

  const handleCreatePublishableKey = useCallback(async () => {
    if (!accessToken || !selectedProject) {
      setPublishableKeyError('Select a Gateway project before creating a client key.');
      return;
    }

    const label = publishableKeyLabel.trim();
    if (!label) {
      setPublishableKeyError('Enter a publishable Gateway client key label.');
      return;
    }

    setCreatingPublishableKey(true);
    setPublishableKeyError(null);
    setPublishableKeyMessage(null);

    try {
      const result = await createQuantumGatewayPublishableKey(
        QUANTUM_GATEWAY_BASE_URL,
        accessToken,
        selectedProject.projectSlug,
        { label }
      );

      if (!result.rawKey) {
        throw new Error('The gateway API created the client key, but no secret was returned.');
      }

      setPublishableKeyReveal({
        action: 'created',
        label: result.key?.label ?? label,
        rawKey: result.rawKey,
      });
      setPublishableKeyLabel('');
      setPublishableKeyMessage(result.message ?? `Created client key "${label}".`);
      await refreshPublishableKeys(selectedProject.projectSlug);
    } catch (error) {
      setPublishableKeyError(toQuantumGatewayUserMessage(error));
    } finally {
      setCreatingPublishableKey(false);
    }
  }, [
    accessToken,
    publishableKeyLabel,
    refreshPublishableKeys,
    selectedProject,
  ]);

  const handleRotatePublishableKey = useCallback(
    async (key: QuantumGatewayPublishableKeyRecord) => {
      if (!accessToken || !selectedProject) return;

      setBusyPublishableKeyId(key.keyId);
      setPublishableKeyError(null);
      setPublishableKeyMessage(null);

      try {
        const result = await rotateQuantumGatewayPublishableKey(
          QUANTUM_GATEWAY_BASE_URL,
          accessToken,
          selectedProject.projectSlug,
          key.keyId
        );

        if (!result.rawKey) {
          throw new Error('The gateway API rotated the client key, but no secret was returned.');
        }

        setPublishableKeyReveal({
          action: 'rotated',
          label: result.newKey?.label ?? result.key?.label ?? key.label,
          rawKey: result.rawKey,
        });
        setPublishableKeyMessage(
          result.message ?? `Rotated client key "${result.newKey?.label ?? key.label}".`
        );
        await refreshPublishableKeys(selectedProject.projectSlug);
      } catch (error) {
        setPublishableKeyError(toQuantumGatewayUserMessage(error));
      } finally {
        setBusyPublishableKeyId(null);
      }
    },
    [accessToken, refreshPublishableKeys, selectedProject]
  );

  const handleRevokePublishableKey = useCallback(
    async (key: QuantumGatewayPublishableKeyRecord) => {
      if (!accessToken || !selectedProject) return;

      const confirmed = await confirmAction(
        `Revoke publishable Gateway client key "${key.label}"?`
      );
      if (!confirmed) return;

      setBusyPublishableKeyId(key.keyId);
      setPublishableKeyError(null);
      setPublishableKeyMessage(null);

      try {
        const result = await revokeQuantumGatewayPublishableKey(
          QUANTUM_GATEWAY_BASE_URL,
          accessToken,
          selectedProject.projectSlug,
          key.keyId
        );

        setPublishableKeyMessage(result.message ?? `Revoked client key "${key.label}".`);
        await refreshPublishableKeys(selectedProject.projectSlug);
      } catch (error) {
        setPublishableKeyError(toQuantumGatewayUserMessage(error));
      } finally {
        setBusyPublishableKeyId(null);
      }
    },
    [accessToken, refreshPublishableKeys, selectedProject]
  );

  const handleMintRuntimeSession = useCallback(async () => {
    const secret = runtimePublishableKey.trim();
    if (!secret) {
      setRuntimeSessionError('Paste a publishable Gateway client key to mint a runtime token.');
      return;
    }

    setMintingRuntimeSession(true);
    setRuntimeSessionError(null);
    setRuntimeSessionResult(null);

    try {
      const result = await mintGatewayRuntimeSession(QUANTUM_GATEWAY_BASE_URL, secret);
      if (!result.token) {
        throw new Error('The gateway API did not return a runtime token.');
      }

      setRuntimeSessionResult({
        token: result.token,
        expiresAt: result.expiresAt ?? null,
        projectId: result.projectId ?? null,
      });
    } catch (error) {
      setRuntimeSessionError(
        error instanceof Error ? error.message : 'Unable to mint a runtime token.'
      );
    } finally {
      setMintingRuntimeSession(false);
    }
  }, [runtimePublishableKey]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  const gatewayCopy = useMemo(
    () => [
      'Gateway projects live in Identerest-backed Gateway records.',
      'Quantum API keys and IBM profiles stay in Quantum API tables; the Gateway only stores references.',
      'Publishable Gateway client keys mint short-lived runtime tokens for public traffic.',
      'Direct Quantum API key mode stays as a local/dev fallback, not the shipped runtime story.',
    ],
    []
  );

  return (
    <TabContainer
      titleA="Quantum"
      titleB="Gateway"
      leadBody="Manage public Gateway projects, bind Quantum API keys and IBM profiles, and mint runtime tokens for clients without exposing raw secrets."
      leadSubBody="This page is the onboarding and settings hub for the public Gateway story. Signed-in Identerest accounts can create projects, manage publishable Gateway client keys, and keep the runtime path separate from direct Quantum API access."
      seo={{
        title: 'Quantum Gateway',
        description:
          'Public Gateway project onboarding, settings, and publishable client key management tied to one Identerest account.',
        path: '/quantum-gateway',
        keywords: [
          'quantum gateway',
          'gateway project',
          'publishable gateway client key',
          'runtime token',
          'identerest account',
          'quantum api key',
        ],
        type: 'website',
      }}
    >
      <View className="w-full max-w-[1120px] gap-4">
        <View
          className="rounded-3xl border p-4 md:p-5"
          style={{
            backgroundColor: accentColor + '18',
            borderColor: tintColor + '33',
          }}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="globe-outline" size={20} color={tintColor} />
                <ThemedText className="font-bold text-lg">Public Gateway management</ThemedText>
              </View>
              <ThemedText className="opacity-85 leading-6">
                Build the public runtime surface around Gateway projects, not around personal API key sharing.
              </ThemedText>
            </View>

            <ExternalLink
              href={QUANTUM_GATEWAY_DOCS_URL}
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: tintColor }}
            >
              <ThemedText inverse className="font-bold text-sm uppercase tracking-[0.14em]">
                Gateway docs
              </ThemedText>
            </ExternalLink>
          </View>

          <View className="mt-4 gap-2">
            {gatewayCopy.map((line) => (
              <View key={line} className="flex-row items-start gap-2">
                <Ionicons name="checkmark-circle-outline" size={18} color={tintColor} />
                <ThemedText className="flex-1 opacity-90 leading-6">{line}</ThemedText>
              </View>
            ))}
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: tintColor + '22' }}
            >
              <ThemedText className="text-xs font-bold uppercase tracking-[0.14em]">
                Runtime base: {QUANTUM_GATEWAY_BASE_URL}
              </ThemedText>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: tintColor + '16' }}
            >
              <ThemedText className="text-xs font-bold uppercase tracking-[0.14em]">
                Quantum API base: {QUANTUM_API_BASE_URL}
              </ThemedText>
            </View>
          </View>
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
            <ThemedText selectable className="opacity-85 leading-6">
              {getSupabaseConfigError()} Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable Identerest account sign in on this page.
            </ThemedText>
          </View>
        ) : bootstrapping ? (
          <View className="rounded-2xl p-5" style={{ backgroundColor: backgroundColor }}>
            <ActivityIndicator color={tintColor} />
            <ThemedText className="mt-3 text-center opacity-80">
              Restoring your Identerest session...
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
                  Sign in with your Identerest account
                </ThemedText>
                <ThemedText className="mb-4 opacity-80 leading-6">
                  Use a passwordless email link or continue with GitHub. This same Identerest account can own Gateway projects, Quantum API keys, and IBM credential profiles.
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
                            Email magic link
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
                        Signed in via Identerest account
                      </ThemedText>
                      <ThemedText selectable className="opacity-80 text-base leading-6">
                        {session.user.email ?? 'Authenticated Gateway operator'}
                      </ThemedText>
                    </View>

                    <Pressable
                      disabled={signingOut}
                      onPress={handleSignOut}
                      style={({ pressed }) => ({
                        backgroundColor: accentColor + '18',
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

                  <View className="gap-3 md:flex-row">
                    <View className="flex-1 gap-2">
                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                        Choose a default Quantum API key
                      </ThemedText>
                      {availableQuantumKeys.length > 0 ? (
                        <View
                          style={{
                            backgroundColor: pickerBackgroundColor,
                            borderColor: pickerBorderColor,
                            borderRadius: 16,
                            borderWidth: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Picker
                            selectedValue={projectForm.defaultApiKeyId || ''}
                            onValueChange={(value) =>
                              handleProjectField('defaultApiKeyId', String(value))
                            }
                            style={{
                              backgroundColor: pickerBackgroundColor,
                              color: pickerTextColor,
                              height: 52,
                            }}
                            dropdownIconColor={pickerTextColor}
                          >
                            <Picker.Item color={pickerTextColor} label="None" value="" />
                            {availableQuantumKeys.map((key) => (
                              <Picker.Item
                                key={key.id}
                                color={pickerTextColor}
                                label={`${key.label} • ${key.maskedKey}`}
                                value={key.id}
                              />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={(value) => handleProjectField('defaultApiKeyId', value)}
                          placeholder="Quantum API key id"
                          placeholderTextColor={textColor + '70'}
                          style={{
                            backgroundColor: accentColor + '12',
                            borderColor: tintColor + '30',
                            borderRadius: 16,
                            borderWidth: 1,
                            color: textColor,
                            fontSize: 16,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                          }}
                          value={projectForm.defaultApiKeyId}
                        />
                      )}
                    </View>

                    <View className="flex-1 gap-2">
                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                        Choose a default IBM profile
                      </ThemedText>
                      {availableIbmProfiles.length > 0 ? (
                        <View
                          style={{
                            backgroundColor: pickerBackgroundColor,
                            borderColor: pickerBorderColor,
                            borderRadius: 16,
                            borderWidth: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Picker
                            selectedValue={projectForm.defaultIbmCredentialProfileId || ''}
                            onValueChange={(value) =>
                              handleProjectField('defaultIbmCredentialProfileId', String(value))
                            }
                            style={{
                              backgroundColor: pickerBackgroundColor,
                              color: pickerTextColor,
                              height: 52,
                            }}
                            dropdownIconColor={pickerTextColor}
                          >
                            <Picker.Item color={pickerTextColor} label="None" value="" />
                            {availableIbmProfiles.map((profile) => (
                              <Picker.Item
                                key={profile.profileId}
                                color={pickerTextColor}
                                label={`${profile.profileName} • ${profile.maskedToken}`}
                                value={profile.profileId}
                              />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={(value) =>
                            handleProjectField('defaultIbmCredentialProfileId', value)
                          }
                          placeholder="IBM profile id"
                          placeholderTextColor={textColor + '70'}
                          style={{
                            backgroundColor: accentColor + '12',
                            borderColor: tintColor + '30',
                            borderRadius: 16,
                            borderWidth: 1,
                            color: textColor,
                            fontSize: 16,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                          }}
                          value={projectForm.defaultIbmCredentialProfileId}
                        />
                      )}
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={handleNewProject}
                      style={({ pressed }) => ({
                        backgroundColor: backgroundColor,
                        borderColor: tintColor + '35',
                        borderRadius: 14,
                        borderWidth: 1,
                        opacity: pressed ? 0.72 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      })}
                    >
                      <ThemedText className="font-bold text-sm uppercase tracking-[0.14em]" style={{ color: secondaryColor }}>
                        New project
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={refreshProjects}
                      style={({ pressed }) => ({
                        backgroundColor: backgroundColor,
                        borderColor: tintColor + '35',
                        borderRadius: 14,
                        borderWidth: 1,
                        opacity: pressed ? 0.72 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      })}
                    >
                      <ThemedText className="font-bold text-sm uppercase tracking-[0.14em]" style={{ color: secondaryColor }}>
                        Refresh projects
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {projectError ? (
                  <View
                    className="rounded-2xl border px-4 py-3"
                    style={{ backgroundColor: '#ef444418', borderColor: '#ef444455' }}
                  >
                    <ThemedText selectable className="leading-6" style={{ color: '#f87171' }}>
                      {projectError}
                    </ThemedText>
                  </View>
                ) : null}

                {projectMessage ? (
                  <View
                    className="rounded-2xl border px-4 py-3"
                    style={{ backgroundColor: tintColor + '16', borderColor: tintColor + '40' }}
                  >
                    <ThemedText selectable className="leading-6">
                      {projectMessage}
                    </ThemedText>
                  </View>
                ) : null}

                <View className="rounded-2xl border p-4" style={{ backgroundColor: backgroundColor, borderColor: accentColor + '35' }}>
                  <View className="mb-3 flex-row items-center justify-between gap-3">
                    <View>
                      <ThemedText type="defaultSemiBold" className="text-lg">
                        {editingProjectSlug ? 'Edit Gateway project' : 'Create Gateway project'}
                      </ThemedText>
                      <ThemedText className="opacity-75 text-base">
                        Project routing, limits, and credential references
                      </ThemedText>
                    </View>

                    {loadingProjects ? <ActivityIndicator color={tintColor} /> : null}
                  </View>

                  <View className="gap-3">
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={(value) => handleProjectField('projectSlug', value)}
                      placeholder="project slug"
                      placeholderTextColor={textColor + '70'}
                      style={{
                        backgroundColor: accentColor + '12',
                        borderColor: tintColor + '30',
                        borderRadius: 16,
                        borderWidth: 1,
                        color: textColor,
                        fontSize: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                      value={projectForm.projectSlug}
                    />

                    <TextInput
                      autoCapitalize="words"
                      onChangeText={(value) => handleProjectField('displayName', value)}
                      placeholder="display name"
                      placeholderTextColor={textColor + '70'}
                      style={{
                        backgroundColor: accentColor + '12',
                        borderColor: tintColor + '30',
                        borderRadius: 16,
                        borderWidth: 1,
                        color: textColor,
                        fontSize: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                      value={projectForm.displayName}
                    />

                    <View className="gap-2">
                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                        Project status
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: pickerBackgroundColor,
                          borderColor: pickerBorderColor,
                          borderRadius: 16,
                          borderWidth: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Picker
                          selectedValue={projectForm.status}
                          onValueChange={(value) => handleProjectField('status', String(value))}
                          style={{
                            backgroundColor: pickerBackgroundColor,
                            color: pickerTextColor,
                            height: 52,
                          }}
                          dropdownIconColor={pickerTextColor}
                        >
                          <Picker.Item color={pickerTextColor} label="active" value="active" />
                          <Picker.Item color={pickerTextColor} label="paused" value="paused" />
                          <Picker.Item color={pickerTextColor} label="archived" value="archived" />
                        </Picker>
                      </View>
                    </View>

                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={(value) => handleProjectField('endpointPathPrefix', value)}
                      placeholder="/public-facing/api/quantum-gateway/v1"
                      placeholderTextColor={textColor + '70'}
                      style={{
                        backgroundColor: accentColor + '12',
                        borderColor: tintColor + '30',
                        borderRadius: 16,
                        borderWidth: 1,
                        color: textColor,
                        fontSize: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                      value={projectForm.endpointPathPrefix}
                    />

                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="numeric"
                      onChangeText={(value) => handleProjectField('defaultRateLimitPerMinute', value)}
                      placeholder="default rate limit per minute"
                      placeholderTextColor={textColor + '70'}
                      style={{
                        backgroundColor: accentColor + '12',
                        borderColor: tintColor + '30',
                        borderRadius: 16,
                        borderWidth: 1,
                        color: textColor,
                        fontSize: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                      value={projectForm.defaultRateLimitPerMinute}
                    />

                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="numeric"
                      onChangeText={(value) => handleProjectField('dailyRequestQuota', value)}
                      placeholder="daily request quota"
                      placeholderTextColor={textColor + '70'}
                      style={{
                        backgroundColor: accentColor + '12',
                        borderColor: tintColor + '30',
                        borderRadius: 16,
                        borderWidth: 1,
                        color: textColor,
                        fontSize: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                      value={projectForm.dailyRequestQuota}
                    />

                    <View className="gap-2">
                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                        Route allowlist
                      </ThemedText>
                      <TextInput
                        multiline
                        numberOfLines={3}
                        onChangeText={(value) => handleProjectField('routeAllowlistText', value)}
                        placeholder="/v1/health, /v1/gates/run"
                        placeholderTextColor={textColor + '70'}
                        style={{
                          backgroundColor: accentColor + '12',
                          borderColor: tintColor + '30',
                          borderRadius: 16,
                          borderWidth: 1,
                          color: textColor,
                          fontSize: 16,
                          minHeight: 92,
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                          textAlignVertical: 'top',
                        }}
                        value={projectForm.routeAllowlistText}
                      />
                    </View>

                    <View className="gap-2">
                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                        Allowed origins
                      </ThemedText>
                      <TextInput
                        multiline
                        numberOfLines={3}
                        onChangeText={(value) => handleProjectField('allowedOriginsText', value)}
                        placeholder="https://example.com, https://www.example.com"
                        placeholderTextColor={textColor + '70'}
                        style={{
                          backgroundColor: accentColor + '12',
                          borderColor: tintColor + '30',
                          borderRadius: 16,
                          borderWidth: 1,
                          color: textColor,
                          fontSize: 16,
                          minHeight: 92,
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                          textAlignVertical: 'top',
                        }}
                        value={projectForm.allowedOriginsText}
                      />
                    </View>

                    <View className="gap-3 md:flex-row">
                      <Pressable
                        disabled={savingProject}
                        onPress={handleSaveProject}
                        style={({ pressed }) => ({
                          alignItems: 'center',
                          backgroundColor: tintColor,
                          borderRadius: 16,
                          flex: 1,
                          justifyContent: 'center',
                          opacity: pressed || savingProject ? 0.72 : 1,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                        })}
                      >
                        {savingProject ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <ThemedText inverse className="font-bold text-base">
                            {editingProjectSlug ? 'Save project' : 'Create project'}
                          </ThemedText>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => setProjectForm(createEmptyProjectForm())}
                        style={({ pressed }) => ({
                          alignItems: 'center',
                          backgroundColor: backgroundColor,
                          borderColor: tintColor + '40',
                          borderRadius: 16,
                          borderWidth: 1,
                          flex: 1,
                          justifyContent: 'center',
                          opacity: pressed ? 0.72 : 1,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                        })}
                      >
                        <ThemedText className="font-bold text-base" style={{ color: secondaryColor }}>
                          Reset form
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View className="rounded-2xl border p-4" style={{ backgroundColor: backgroundColor, borderColor: accentColor + '35' }}>
                  <View className="mb-3 flex-row items-center justify-between gap-3">
                    <View>
                      <ThemedText type="defaultSemiBold" className="text-lg">
                        Gateway projects
                      </ThemedText>
                      <ThemedText className="opacity-75 text-base">
                        {projects.length} total, {activeProjectCount} active
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={refreshProjects}
                      style={({ pressed }) => ({
                        opacity: pressed || loadingProjects ? 0.72 : 1,
                        padding: 4,
                      })}
                    >
                      {loadingProjects ? (
                        <ActivityIndicator color={secondaryColor} />
                      ) : (
                        <Ionicons color={secondaryColor} name="refresh" size={18} />
                      )}
                    </Pressable>
                  </View>

                  {loadingProjects ? (
                    <View className="items-center py-6">
                      <ActivityIndicator color={tintColor} />
                      <ThemedText className="mt-3 opacity-75">Loading gateway projects...</ThemedText>
                    </View>
                  ) : projects.length === 0 ? (
                    <View
                      className="rounded-2xl border border-dashed p-4"
                      style={{
                        backgroundColor: accentColor + '0d',
                        borderColor: tintColor + '33',
                      }}
                    >
                      <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                        No Gateway projects yet
                      </ThemedText>
                      <ThemedText className="opacity-80 leading-6">
                        Create the first Gateway project, bind a default Quantum API key and IBM profile, then publish a client key for runtime access.
                      </ThemedText>
                    </View>
                  ) : (
                    <View className="gap-3">
                      {projects.map((project) => {
                        const isSelected = selectedProject?.projectSlug === project.projectSlug;
                        const isEditing = editingProjectSlug === project.projectSlug;
                        const isBusy = savingProject && editingProjectSlug === project.projectSlug;

                        return (
                          <View
                            key={project.id}
                            className="rounded-2xl border p-4"
                            style={{
                              backgroundColor: isSelected ? accentColor + '16' : accentColor + '10',
                              borderColor: isSelected ? tintColor + '55' : tintColor + '2f',
                            }}
                          >
                            <View className="mb-3 flex-row items-start justify-between gap-3">
                              <View className="flex-1">
                                <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                                  {project.displayName}
                                </ThemedText>
                                <ThemedText className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
                                  /{project.projectSlug} • {project.status}
                                </ThemedText>
                              </View>

                              <View
                                className="rounded-full px-3 py-1"
                                style={{ backgroundColor: tintColor + '22' }}
                              >
                                <ThemedText className="text-xs font-bold uppercase tracking-[0.14em]">
                                  {isSelected ? 'Selected' : 'Gateway project'}
                                </ThemedText>
                              </View>
                            </View>

                            <View className="gap-1 mb-3">
                              <ThemedText className="opacity-75 text-sm">
                                Path prefix: {project.endpointPathPrefix}
                              </ThemedText>
                              <ThemedText className="opacity-75 text-sm">
                                Quantum API key: {shortenId(project.defaultApiKeyId)}
                              </ThemedText>
                              <ThemedText className="opacity-75 text-sm">
                                IBM profile: {shortenId(project.defaultIbmCredentialProfileId)}
                              </ThemedText>
                              <ThemedText className="opacity-75 text-sm">
                                Origins: {project.allowedOrigins.length > 0 ? project.allowedOrigins.join(', ') : 'None'}
                              </ThemedText>
                            </View>

                            <View className="gap-2 md:flex-row md:flex-wrap">
                              <Pressable
                                disabled={isBusy}
                                onPress={() => {
                                  setSelectedProjectSlug(project.projectSlug);
                                  refreshPublishableKeys(project.projectSlug);
                                }}
                                style={({ pressed }) => ({
                                  alignItems: 'center',
                                  backgroundColor: tintColor,
                                  borderRadius: 12,
                                  justifyContent: 'center',
                                  opacity: pressed || isBusy ? 0.72 : 1,
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                })}
                              >
                                <ThemedText inverse className="font-bold text-xs uppercase tracking-[0.12em]">
                                  Select
                                </ThemedText>
                              </Pressable>

                              <Pressable
                                disabled={isBusy}
                                onPress={() => handleSelectProject(project)}
                                style={({ pressed }) => ({
                                  alignItems: 'center',
                                  backgroundColor: backgroundColor,
                                  borderColor: tintColor + '40',
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  justifyContent: 'center',
                                  opacity: pressed || isBusy ? 0.72 : 1,
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                })}
                              >
                                <ThemedText
                                  className="font-bold text-xs uppercase tracking-[0.12em]"
                                  style={{ color: secondaryColor }}
                                >
                                  {isEditing ? 'Editing' : 'Edit'}
                                </ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View className="rounded-2xl border p-4" style={{ backgroundColor: backgroundColor, borderColor: accentColor + '35' }}>
                  <View className="mb-3 flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <ThemedText type="defaultSemiBold" className="text-lg">
                        Publishable Gateway client keys
                      </ThemedText>
                      <ThemedText className="opacity-75 text-base">
                        {selectedProject
                          ? `Keys for /${selectedProject.projectSlug}`
                          : 'Select a Gateway project to manage client keys'}
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() => refreshPublishableKeys(selectedProject?.projectSlug ?? null)}
                      style={({ pressed }) => ({
                        opacity: pressed || loadingPublishableKeys ? 0.72 : 1,
                        padding: 4,
                      })}
                    >
                      {loadingPublishableKeys ? (
                        <ActivityIndicator color={secondaryColor} />
                      ) : (
                        <Ionicons color={secondaryColor} name="refresh" size={18} />
                      )}
                    </Pressable>
                  </View>

                  {selectedProject ? (
                    <View className="gap-3">
                      <TextInput
                        autoCapitalize="words"
                        autoCorrect={false}
                        onChangeText={setPublishableKeyLabel}
                        placeholder="Publishable client key label"
                        placeholderTextColor={textColor + '70'}
                        style={{
                          backgroundColor: accentColor + '12',
                          borderColor: tintColor + '30',
                          borderRadius: 16,
                          borderWidth: 1,
                          color: textColor,
                          fontSize: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                        }}
                        value={publishableKeyLabel}
                      />

                      <View className="gap-3 md:flex-row">
                        <Pressable
                          disabled={creatingPublishableKey}
                          onPress={handleCreatePublishableKey}
                          style={({ pressed }) => ({
                            alignItems: 'center',
                            backgroundColor: tintColor,
                            borderRadius: 16,
                            flex: 1,
                            justifyContent: 'center',
                            opacity: pressed || creatingPublishableKey ? 0.72 : 1,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                          })}
                        >
                          {creatingPublishableKey ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <ThemedText inverse className="font-bold text-base">
                              Create client key
                            </ThemedText>
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() => setRuntimePublishableKey(publishableKeyReveal?.rawKey ?? '')}
                          style={({ pressed }) => ({
                            alignItems: 'center',
                            backgroundColor: backgroundColor,
                            borderColor: tintColor + '40',
                            borderRadius: 16,
                            borderWidth: 1,
                            flex: 1,
                            justifyContent: 'center',
                            opacity: pressed ? 0.72 : 1,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                          })}
                        >
                          <ThemedText className="font-bold text-base" style={{ color: secondaryColor }}>
                            Use last secret for runtime test
                          </ThemedText>
                        </Pressable>
                      </View>

                      {publishableKeyReveal ? (
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
                                {publishableKeyReveal.action === 'created'
                                  ? 'New client key generated'
                                  : 'Client key rotated'}
                              </ThemedText>
                              <ThemedText className="opacity-80 leading-6">
                                Save this secret now. It is visible once and then only the masked version remains.
                              </ThemedText>
                            </View>

                            <Pressable
                              onPress={() => setPublishableKeyReveal(null)}
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
                            <ThemedText className="mb-1 opacity-70 text-sm uppercase tracking-[0.14em]">
                              {publishableKeyReveal.label}
                            </ThemedText>
                            <ThemedText
                              selectable
                              className="font-mono text-sm leading-6"
                              style={{ color: secondaryColor }}
                            >
                              {publishableKeyReveal.rawKey}
                            </ThemedText>
                          </View>

                          <Pressable
                            onPress={() =>
                              handleCopy(publishableKeyReveal.rawKey, publishableKeyReveal.rawKey)
                            }
                            style={({ pressed }) => ({
                              alignItems: 'center',
                              alignSelf: 'flex-start',
                              backgroundColor: backgroundColor,
                              borderColor: tintColor + '30',
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
                              name={copiedValue === publishableKeyReveal.rawKey ? 'checkmark' : 'copy-outline'}
                              size={16}
                            />
                            <ThemedText
                              className="font-bold text-sm uppercase tracking-[0.14em]"
                              style={{ color: secondaryColor }}
                            >
                              {copiedValue === publishableKeyReveal.rawKey ? 'Copied' : 'Copy secret'}
                            </ThemedText>
                          </Pressable>
                        </View>
                      ) : null}

                      {publishableKeyError ? (
                        <View
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            backgroundColor: '#ef444418',
                            borderColor: '#ef444455',
                          }}
                        >
                          <ThemedText selectable className="leading-6" style={{ color: '#f87171' }}>
                            {publishableKeyError}
                          </ThemedText>
                        </View>
                      ) : null}

                      {publishableKeyMessage ? (
                        <View
                          className="rounded-2xl border px-4 py-3"
                          style={{ backgroundColor: tintColor + '16', borderColor: tintColor + '40' }}
                        >
                          <ThemedText selectable className="leading-6">
                            {publishableKeyMessage}
                          </ThemedText>
                        </View>
                      ) : null}

                      {runtimeSessionError ? (
                        <View
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            backgroundColor: '#ef444418',
                            borderColor: '#ef444455',
                          }}
                        >
                          <ThemedText selectable className="leading-6" style={{ color: '#f87171' }}>
                            {runtimeSessionError}
                          </ThemedText>
                        </View>
                      ) : null}

                      {runtimeSessionResult ? (
                        <View
                          className="rounded-2xl border p-4"
                          style={{
                            backgroundColor: tintColor + '12',
                            borderColor: tintColor + '3f',
                          }}
                        >
                          <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                            Runtime token minted
                          </ThemedText>
                          <ThemedText className="opacity-80 leading-6">
                            The runtime token is short-lived and project-bound. Keep it on the client only long enough to call Gateway runtime routes.
                          </ThemedText>
                          <View
                            className="rounded-2xl border p-3 mt-3"
                            style={{ backgroundColor: backgroundColor, borderColor: tintColor + '2a' }}
                          >
                            <ThemedText className="mb-1 opacity-70 text-sm uppercase tracking-[0.14em]">
                              runtime token
                            </ThemedText>
                            <ThemedText selectable className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
                              {runtimeSessionResult.token}
                            </ThemedText>
                          </View>
                          <ThemedText className="mt-2 opacity-75 text-sm">
                            Project: {runtimeSessionResult.projectId ?? 'Not returned'} • Expires: {formatTimestamp(runtimeSessionResult.expiresAt)}
                          </ThemedText>
                          <Pressable
                            onPress={() => handleCopy(runtimeSessionResult.token, 'runtime-token')}
                            style={({ pressed }) => ({
                              alignItems: 'center',
                              alignSelf: 'flex-start',
                              backgroundColor: backgroundColor,
                              borderColor: tintColor + '30',
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
                              name={copiedValue === 'runtime-token' ? 'checkmark' : 'copy-outline'}
                              size={16}
                            />
                            <ThemedText
                              className="font-bold text-sm uppercase tracking-[0.14em]"
                              style={{ color: secondaryColor }}
                            >
                              {copiedValue === 'runtime-token' ? 'Copied' : 'Copy token'}
                            </ThemedText>
                          </Pressable>
                        </View>
                      ) : null}

                      <View className="rounded-2xl border p-4" style={{ backgroundColor: accentColor + '10', borderColor: tintColor + '2f' }}>
                        <View className="mb-3 flex-row items-center justify-between gap-3">
                          <View>
                            <ThemedText type="defaultSemiBold" className="text-lg">
                              Publishable key list
                            </ThemedText>
                            <ThemedText className="opacity-75 text-base">
                              {publishableKeys.length} client key{publishableKeys.length === 1 ? '' : 's'}
                            </ThemedText>
                          </View>

                          {loadingPublishableKeys ? <ActivityIndicator color={secondaryColor} /> : null}
                        </View>

                        {loadingPublishableKeys ? (
                          <View className="items-center py-6">
                            <ActivityIndicator color={tintColor} />
                            <ThemedText className="mt-3 opacity-75">Loading publishable keys...</ThemedText>
                          </View>
                        ) : publishableKeys.length === 0 ? (
                          <View
                            className="rounded-2xl border border-dashed p-4"
                            style={{
                              backgroundColor: accentColor + '0d',
                              borderColor: tintColor + '33',
                            }}
                          >
                            <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                              No publishable keys yet
                            </ThemedText>
                            <ThemedText className="opacity-80 leading-6">
                              Create a Gateway client key to let a game or app mint a short-lived runtime token.
                            </ThemedText>
                          </View>
                        ) : (
                          <View className="gap-3">
                        {publishableKeys.map((key) => {
                              const isBusy = busyPublishableKeyId === key.keyId;
                              const isInactive = key.status !== 'active';

                              return (
                                <View
                                  key={key.keyId}
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
                                      <ThemedText className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
                                        {key.maskedKey}
                                      </ThemedText>
                                    </View>

                                    <View
                                      className="rounded-full px-3 py-1"
                                      style={{ backgroundColor: tintColor + '22' }}
                                    >
                                      <ThemedText className="text-xs font-bold uppercase tracking-[0.14em]">
                                        {key.status}
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

                                  <View className="gap-2 md:flex-row md:flex-wrap">
                                    <Pressable
                                      disabled={isBusy || isInactive}
                                      onPress={() => handleRotatePublishableKey(key)}
                                      style={({ pressed }) => ({
                                        alignItems: 'center',
                                        backgroundColor: isInactive ? accentColor + '16' : tintColor,
                                        borderRadius: 12,
                                        justifyContent: 'center',
                                        opacity: pressed || isBusy || isInactive ? 0.72 : 1,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                      })}
                                    >
                                      {isBusy ? (
                                        <ActivityIndicator color="#fff" />
                                      ) : (
                                        <ThemedText inverse className="font-bold text-xs uppercase tracking-[0.12em]">
                                          Rotate
                                        </ThemedText>
                                      )}
                                    </Pressable>

                                    <Pressable
                                      disabled={isBusy || isInactive}
                                      onPress={() => handleRevokePublishableKey(key)}
                                      style={({ pressed }) => ({
                                        alignItems: 'center',
                                        backgroundColor: backgroundColor,
                                        borderColor: '#ef444466',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        justifyContent: 'center',
                                        opacity: pressed || isBusy || isInactive ? 0.72 : 1,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                      })}
                                    >
                                      <ThemedText
                                        className="font-bold text-xs uppercase tracking-[0.12em]"
                                        style={{ color: '#f87171' }}
                                      >
                                        Revoke
                                      </ThemedText>
                                    </Pressable>

                                    <Pressable
                                      disabled={isBusy}
                                      onPress={() => handleCopy(key.keyId, key.keyId)}
                                      style={({ pressed }) => ({
                                        alignItems: 'center',
                                        backgroundColor: backgroundColor,
                                        borderColor: tintColor + '40',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        justifyContent: 'center',
                                        opacity: pressed || isBusy ? 0.72 : 1,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                      })}
                                    >
                                      <ThemedText
                                        className="font-bold text-xs uppercase tracking-[0.12em]"
                                        style={{ color: secondaryColor }}
                                      >
                                        Copy id
                                      </ThemedText>
                                    </Pressable>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      <View className="rounded-2xl border p-4" style={{ backgroundColor: backgroundColor, borderColor: accentColor + '35' }}>
                        <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
                          Mint a runtime token
                        </ThemedText>
                        <ThemedText className="opacity-80 leading-6 mb-3">
                          Use the publishable Gateway client key to mint a short-lived runtime token. That token is what clients send to public runtime routes.
                        </ThemedText>

                        <View className="gap-3">
                          <TextInput
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setRuntimePublishableKey}
                            placeholder="publishable Gateway client key"
                            placeholderTextColor={textColor + '70'}
                            style={{
                              backgroundColor: accentColor + '12',
                              borderColor: tintColor + '30',
                              borderRadius: 16,
                              borderWidth: 1,
                              color: textColor,
                              fontSize: 16,
                              paddingHorizontal: 14,
                              paddingVertical: 14,
                            }}
                            value={runtimePublishableKey}
                          />

                          <Pressable
                            disabled={mintingRuntimeSession}
                            onPress={handleMintRuntimeSession}
                            style={({ pressed }) => ({
                              alignItems: 'center',
                              backgroundColor: tintColor,
                              borderRadius: 16,
                              justifyContent: 'center',
                              opacity: pressed || mintingRuntimeSession ? 0.72 : 1,
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                            })}
                          >
                            {mintingRuntimeSession ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <ThemedText inverse className="font-bold text-base">
                                Mint runtime token
                              </ThemedText>
                            )}
                          </Pressable>

                          {runtimeSessionResult ? (
                            <View className="rounded-2xl border p-4" style={{ backgroundColor: tintColor + '12', borderColor: tintColor + '3f' }}>
                              <ThemedText className="opacity-80 leading-6">
                                Runtime session returned a short-lived token for project {runtimeSessionResult.projectId ?? selectedProject.projectSlug}.
                              </ThemedText>
                              <ThemedText selectable className="font-mono text-sm leading-6 mt-2" style={{ color: secondaryColor }}>
                                {runtimeSessionResult.token}
                              </ThemedText>
                              <ThemedText className="opacity-75 text-sm mt-2">
                                Expires: {formatTimestamp(runtimeSessionResult.expiresAt)}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View
                      className="rounded-2xl border border-dashed p-4"
                      style={{
                        backgroundColor: accentColor + '0d',
                        borderColor: tintColor + '33',
                      }}
                    >
                      <ThemedText type="defaultSemiBold" className="mb-1 text-lg">
                        No Gateway project selected
                      </ThemedText>
                      <ThemedText className="opacity-80 leading-6">
                        Select or create a Gateway project to manage publishable client keys and mint runtime tokens.
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View className="rounded-2xl border p-4" style={{ backgroundColor: backgroundColor, borderColor: accentColor + '35' }}>
                  <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
                    Runtime examples
                  </ThemedText>
                  <ThemedText className="opacity-80 leading-6 mb-3">
                    Public clients should target the Gateway runtime base and send a bearer runtime token, not a raw Quantum API key.
                  </ThemedText>

                  <View className="rounded-2xl border p-3" style={{ backgroundColor: accentColor + '10', borderColor: tintColor + '2f' }}>
                    <ScrollView horizontal>
                      <ThemedText selectable className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
{`const response = await fetch('${QUANTUM_GATEWAY_BASE_URL}/gates/run', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${runtimeToken}\`,
    'X-Project-Id': '<gateway-project-slug>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    gate_type: 'rotation',
    rotation_angle_rad: Math.PI / 2,
  }),
});`}
                      </ThemedText>
                    </ScrollView>
                  </View>

                  <View className="mt-3 rounded-2xl border p-3" style={{ backgroundColor: accentColor + '10', borderColor: tintColor + '2f' }}>
                    <ThemedText selectable className="font-mono text-sm leading-6" style={{ color: secondaryColor }}>
{`POST ${QUANTUM_GATEWAY_BASE_URL}/runtime-sessions
X-Gateway-Publishable-Key: <publishable_gateway_client_key>`}
                    </ThemedText>
                  </View>

                  <ThemedText className="mt-3 opacity-75 text-sm">
                    Local/dev fallback paths stay explicit in this repo. The shipped runtime story is Gateway-managed and project-scoped.
                  </ThemedText>
                </View>

                {loadingCredentials || credentialsMessage ? (
                  <View
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: accentColor + '10',
                      borderColor: tintColor + '2f',
                    }}
                  >
                    <ThemedText className="opacity-80 leading-6">
                      {loadingCredentials ? 'Loading Quantum API keys and IBM profiles...' : credentialsMessage}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>
      <Modal visible={Boolean(copiedValue)} transparent animationType="fade">
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
            flex: 1,
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            className="rounded-2xl border p-4"
            style={{ backgroundColor: backgroundColor, borderColor: tintColor + '40', width: '100%', maxWidth: 420 }}
          >
            <ThemedText type="defaultSemiBold" className="mb-2 text-lg">
              Copied
            </ThemedText>
            <ThemedText className="opacity-80 leading-6">
              The value is on your clipboard. Paste it where you need it, then keep the raw secret out of source control.
            </ThemedText>
            <Pressable
              onPress={() => setCopiedValue(null)}
              style={({ pressed }) => ({
                alignSelf: 'flex-end',
                backgroundColor: tintColor,
                borderRadius: 12,
                marginTop: 16,
                opacity: pressed ? 0.72 : 1,
                paddingHorizontal: 14,
                paddingVertical: 10,
              })}
            >
              <ThemedText inverse className="font-bold text-sm uppercase tracking-[0.14em]">
                Close
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </TabContainer>
  );
}
