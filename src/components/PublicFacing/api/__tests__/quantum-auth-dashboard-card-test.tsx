import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { QuantumAuthDashboardCard } from '../quantum-auth-dashboard-card';

const mockIsSupabaseConfigured = jest.fn();
const mockGetSupabaseBrowserClient = jest.fn();
const mockGetSupabaseConfigError = jest.fn();
const mockGetQuantumAuthRedirectUrl = jest.fn();
const mockGetSupabaseAuthFlowType = jest.fn();

const mockListQuantumKeys = jest.fn();
const mockListIbmProfiles = jest.fn();
const mockCreateIbmProfile = jest.fn();
const mockCreateQuantumKey = jest.fn();
const mockDeleteIbmProfile = jest.fn();
const mockDeleteQuantumKey = jest.fn();
const mockDeleteRevokedQuantumKeys = jest.fn();
const mockRevokeQuantumKey = jest.fn();
const mockRotateQuantumKey = jest.fn();
const mockUpdateIbmProfile = jest.fn();
const mockVerifyIbmProfile = jest.fn();
const originalWindow = (globalThis as { window?: unknown }).window;

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: (_: unknown, colorName: string) => {
    if (colorName === 'background') return '#0f172a';
    if (colorName === 'accent') return '#1e293b';
    if (colorName === 'tint') return '#f59e0b';
    if (colorName === 'text') return '#f8fafc';
    if (colorName === 'secondary') return '#cbd5e1';
    return '#f8fafc';
  },
}));

jest.mock('@/lib/supabase-browser', () => ({
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
  getSupabaseBrowserClient: () => mockGetSupabaseBrowserClient(),
  getSupabaseConfigError: () => mockGetSupabaseConfigError(),
  getQuantumAuthRedirectUrl: () => mockGetQuantumAuthRedirectUrl(),
  getSupabaseAuthFlowType: () => mockGetSupabaseAuthFlowType(),
}));

jest.mock('@/services/quantum-key-management', () => {
  class QuantumApiError extends Error {
    status?: number;
    details?: unknown;

    constructor(message: string, status?: number, details?: unknown) {
      super(message);
      this.name = 'QuantumApiError';
      this.status = status;
      this.details = details;
    }
  }

  return {
    QuantumApiError,
    toIbmProfileUserMessage: (error: unknown) =>
      error instanceof Error ? error.message : 'Unable to process IBM profile request.',
    createIbmProfile: (...args: unknown[]) => mockCreateIbmProfile(...args),
    createQuantumKey: (...args: unknown[]) => mockCreateQuantumKey(...args),
    deleteIbmProfile: (...args: unknown[]) => mockDeleteIbmProfile(...args),
    deleteQuantumKey: (...args: unknown[]) => mockDeleteQuantumKey(...args),
    deleteRevokedQuantumKeys: (...args: unknown[]) => mockDeleteRevokedQuantumKeys(...args),
    listIbmProfiles: (...args: unknown[]) => mockListIbmProfiles(...args),
    listQuantumKeys: (...args: unknown[]) => mockListQuantumKeys(...args),
    revokeQuantumKey: (...args: unknown[]) => mockRevokeQuantumKey(...args),
    rotateQuantumKey: (...args: unknown[]) => mockRotateQuantumKey(...args),
    updateIbmProfile: (...args: unknown[]) => mockUpdateIbmProfile(...args),
    verifyIbmProfile: (...args: unknown[]) => mockVerifyIbmProfile(...args),
  };
});

function createSupabaseClient(session: unknown) {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      onAuthStateChange: jest.fn((_callback: unknown) => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      signInWithOtp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  };
}

function extractText(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => extractText(child)).join(' ');
  }

  if (React.isValidElement(children)) {
    return extractText((children as React.ReactElement<{ children?: unknown }>).props.children);
  }

  return '';
}

function findNodesByText(root: renderer.ReactTestInstance, text: string) {
  return root.findAll((node) => {
    if (!('children' in node.props)) {
      return false;
    }

    return extractText(node.props.children).includes(text);
  });
}

function findPressableByText(root: renderer.ReactTestInstance, text: string) {
  const matchingNodes = findNodesByText(root, text);
  for (const node of matchingNodes) {
    let current: renderer.ReactTestInstance | null = node;
    while (current) {
      if (typeof current.props?.onPress === 'function') {
        return current;
      }
      current = current.parent;
    }
  }

  return undefined;
}

function findPressableByExactText(root: renderer.ReactTestInstance, text: string) {
  const matchingNodes = root.findAll((node) => {
    if (!('children' in node.props)) {
      return false;
    }

    return extractText(node.props.children).trim() === text;
  });

  for (const node of matchingNodes) {
    let current: renderer.ReactTestInstance | null = node;
    while (current) {
      if (typeof current.props?.onPress === 'function') {
        return current;
      }
      current = current.parent;
    }
  }

  return undefined;
}

function findPressableByIconName(root: renderer.ReactTestInstance, iconName: string) {
  const pressables = root.findAll((node) => typeof node.props?.onPress === 'function');
  return pressables.find((pressable) => {
    return pressable.findAll((node) => node.props?.name === iconName).length > 0;
  });
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('QuantumAuthDashboardCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          search: '',
          hash: '',
          origin: 'http://localhost:8081',
        },
        confirm: jest.fn().mockReturnValue(true),
      },
    });

    mockGetSupabaseConfigError.mockReturnValue('Missing Supabase config.');
    mockGetQuantumAuthRedirectUrl.mockReturnValue('http://localhost:8081/public-facing/api/quantum');
    mockGetSupabaseAuthFlowType.mockReturnValue('pkce');

    mockListQuantumKeys.mockResolvedValue([]);
    mockListIbmProfiles.mockResolvedValue([]);
    mockCreateIbmProfile.mockResolvedValue({});
    mockCreateQuantumKey.mockResolvedValue({});
    mockDeleteIbmProfile.mockResolvedValue({});
    mockDeleteQuantumKey.mockResolvedValue({});
    mockDeleteRevokedQuantumKeys.mockResolvedValue({ deletedCount: 0 });
    mockRevokeQuantumKey.mockResolvedValue({});
    mockRotateQuantumKey.mockResolvedValue({});
    mockUpdateIbmProfile.mockResolvedValue({});
    mockVerifyIbmProfile.mockResolvedValue({ verificationStatus: 'verified' });
  });

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

  it('renders the config warning when Supabase is not configured', async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    expect(findNodesByText(testRenderer.root, 'Identerest auth is not configured yet').length).toBeGreaterThan(0);
    expect(findNodesByText(testRenderer.root, 'Missing Supabase config.').length).toBeGreaterThan(0);
  });

  it('shows a clear message when an auth callback does not restore a session', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          search: '?code=stale-callback-code',
          hash: '',
          origin: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
        },
        confirm: jest.fn().mockReturnValue(true),
      },
    });
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseBrowserClient.mockReturnValue(createSupabaseClient(null));

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    await flushPromises();
    await flushPromises();

    expect(
      findNodesByText(testRenderer.root, 'We could not finish sign in from this callback.').length
    ).toBeGreaterThan(0);
  });

  it('does not wait on a code-only callback when staging uses storage-free auth', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          search: '?code=stale-callback-code',
          hash: '',
          origin: 'https://quizzical-hofstadter.108-175-12-95.plesk.page',
        },
        confirm: jest.fn().mockReturnValue(true),
      },
    });
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseAuthFlowType.mockReturnValue('implicit');
    const supabaseClient = createSupabaseClient(null);
    supabaseClient.auth.getSession.mockImplementation(
      () => new Promise(() => undefined) as ReturnType<typeof supabaseClient.auth.getSession>
    );
    mockGetSupabaseBrowserClient.mockReturnValue(supabaseClient);

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    await flushPromises();

    expect(
      findNodesByText(testRenderer.root, 'We could not finish sign in from this callback.').length
    ).toBeGreaterThan(0);
    expect(supabaseClient.auth.getSession).not.toHaveBeenCalled();
  });

  it('validates required IBM profile fields before submit', async () => {
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'token-123',
        user: { email: 'dj@example.com' },
      })
    );

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(findNodesByText(testRenderer.root, 'Signed in via Identerest Account').length).toBeGreaterThan(0);

    expect(mockListQuantumKeys).toHaveBeenCalledTimes(1);
    expect(mockListIbmProfiles).toHaveBeenCalledTimes(1);

    const ibmToggle =
      findPressableByText(testRenderer.root, 'IBM Credentials') ??
      findPressableByIconName(testRenderer.root, 'chevron-forward');
    expect(ibmToggle).toBeDefined();

    await act(async () => {
      ibmToggle?.props.onPress();
    });

    const createProfileButton = findPressableByText(testRenderer.root, 'Create Profile');
    expect(createProfileButton).toBeDefined();

    await act(async () => {
      createProfileButton?.props.onPress();
    });

    await flushPromises();

    expect(findNodesByText(testRenderer.root, 'Profile name is required.').length).toBeGreaterThan(0);
    expect(mockCreateIbmProfile).not.toHaveBeenCalled();
  });

  it('allows a rotated key delete attempt and refreshes on success', async () => {
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'token-123',
        user: { email: 'dj@example.com' },
      })
    );
    mockListQuantumKeys
      .mockResolvedValueOnce([
        {
          id: 'rotated-key-1',
          label: 'Rotated cleanup candidate',
          maskedKey: 'qapi_rotated_********',
          createdAt: '2026-04-01T00:00:00.000Z',
          lastUsedAt: null,
          revokedAt: '2026-04-02T00:00:00.000Z',
          status: 'rotated',
        },
      ])
      .mockResolvedValueOnce([]);

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(findNodesByText(testRenderer.root, 'Rotated cleanup candidate').length).toBeGreaterThan(0);
    expect(findNodesByText(testRenderer.root, 'Rotated').length).toBeGreaterThan(0);

    const deleteButton = findPressableByExactText(testRenderer.root, 'Delete');
    expect(deleteButton).toBeDefined();

    await act(async () => {
      deleteButton?.props.onPress();
    });

    await flushPromises();

    const confirmMock = ((globalThis as unknown) as { window?: { confirm?: jest.Mock } }).window?.confirm;
    expect(confirmMock).toHaveBeenCalledWith('Delete rotated key "Rotated cleanup candidate" permanently?');
    expect(mockDeleteQuantumKey).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'token-123',
      'rotated-key-1'
    );
    expect(mockListQuantumKeys).toHaveBeenCalledTimes(2);
  });

  it('explains backend support is still required when rotated key delete is rejected', async () => {
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'token-123',
        user: { email: 'dj@example.com' },
      })
    );
    mockListQuantumKeys.mockResolvedValue([
      {
        id: 'rotated-key-2',
        label: 'Blocked rotated key',
        maskedKey: 'qapi_blocked_********',
        createdAt: '2026-04-01T00:00:00.000Z',
        lastUsedAt: null,
        revokedAt: '2026-04-02T00:00:00.000Z',
        status: 'rotated',
      },
    ]);
    mockDeleteQuantumKey.mockRejectedValue(
      Object.assign(new Error('Only revoked keys can be deleted.'), { status: 409 })
    );

    let testRenderer!: renderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = renderer.create(
        <QuantumAuthDashboardCard baseUrl="https://example.com/public-facing/api/quantum/v1" />
      );
    });

    await flushPromises();
    await flushPromises();
    await flushPromises();

    const deleteButton = findPressableByExactText(testRenderer.root, 'Delete');
    expect(deleteButton).toBeDefined();

    await act(async () => {
      deleteButton?.props.onPress();
    });

    await flushPromises();

    expect(
      findNodesByText(testRenderer.root, 'Rotated key cleanup still needs backend support.').length
    ).toBeGreaterThan(0);
    expect(mockDeleteQuantumKey).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'token-123',
      'rotated-key-2'
    );
  });
});
