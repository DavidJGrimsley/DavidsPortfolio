import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { HelloWave } from '../QuantumAnimation';

const mockIsSupabaseConfigured = jest.fn();
const mockGetSupabaseBrowserClient = jest.fn();
const mockListIbmProfiles = jest.fn();
const mockListIbmBackends = jest.fn();
const mockRunQuantumGate = jest.fn();
const mockSubmitIbmCircuitJob = jest.fn();
const mockGetIbmCircuitJobStatus = jest.fn();
const mockGetIbmCircuitJobResult = jest.fn();
const mockCancelIbmCircuitJob = jest.fn();

function mockPickerComponent(props: { children?: React.ReactNode }) {
  return props.children;
}

function mockPickerItem() {
  return null;
}

function mockLottieView() {
  return null;
}

function mockExternalLink({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

jest.mock('@react-native-picker/picker', () => ({
  Picker: Object.assign(mockPickerComponent, {
    Item: mockPickerItem,
  }),
}));

jest.mock('lottie-react-native', () => ({
  __esModule: true,
  default: mockLottieView,
}));

jest.mock('@/components/UI/ExternalLink', () => ({
  ExternalLink: mockExternalLink,
}));

jest.mock('@/lib/quantum-api-config', () => ({
  QUANTUM_API_BASE_URL: 'https://example.com/public-facing/api/quantum/v1',
  resolveQuantumEndpointBaseUrl: () => 'https://example.com/public-facing/api/quantum/v1',
}));

jest.mock('@/lib/supabase-browser', () => ({
  getSupabaseBrowserClient: () => mockGetSupabaseBrowserClient(),
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
}));

jest.mock('@/services/quantum-key-management', () => ({
  listIbmProfiles: (...args: unknown[]) => mockListIbmProfiles(...args),
}));

jest.mock('@/services/quantum-ibm-runtime', () => ({
  getIbmCircuitJobResult: (...args: unknown[]) => mockGetIbmCircuitJobResult(...args),
  getIbmCircuitJobStatus: (...args: unknown[]) => mockGetIbmCircuitJobStatus(...args),
  cancelIbmCircuitJob: (...args: unknown[]) => mockCancelIbmCircuitJob(...args),
  listIbmBackends: (...args: unknown[]) => mockListIbmBackends(...args),
  runQuantumGate: (...args: unknown[]) => mockRunQuantumGate(...args),
  submitIbmCircuitJob: (...args: unknown[]) => mockSubmitIbmCircuitJob(...args),
}));

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

function findTextInputByPlaceholder(root: renderer.ReactTestInstance, placeholder: string) {
  return root.findAll((node) => {
    return node.props.placeholder === placeholder && typeof node.props.onChangeText === 'function';
  })[0];
}

async function flushPromises(times = 1) {
  for (let index = 0; index < times; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe('QuantumAnimation', () => {
  let testRenderer: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabaseBrowserClient.mockReturnValue(createSupabaseClient(null));
    mockRunQuantumGate.mockResolvedValue({
      backend: 'Qiskit Aer simulator',
      gateType: 'rotation',
      measurement: 0,
      superpositionStrength: 0.5,
      success: true,
    });
    mockListIbmProfiles.mockResolvedValue([]);
    mockListIbmBackends.mockResolvedValue([
      {
        name: 'ibm_brisbane',
        provider: 'ibm',
        isSimulator: false,
        isHardware: true,
        numQubits: 127,
        basisGates: ['cx'],
      },
    ]);
    mockSubmitIbmCircuitJob.mockResolvedValue({
      backendName: 'ibm_brisbane',
      jobId: 'job-1',
      provider: 'ibm',
      remoteJobId: 'remote-1',
      status: 'succeeded',
    });
    mockGetIbmCircuitJobResult.mockResolvedValue({
      jobId: 'job-1',
      status: 'succeeded',
      result: {
        counts: { '0': 250, '1': 262 },
        numQubits: 1,
        shots: 512,
      },
    });
  });

  afterEach(() => {
    if (testRenderer) {
      act(() => {
        testRenderer?.unmount();
      });
    }
    testRenderer = null;
  });

  async function renderAnimation() {
    await act(async () => {
      testRenderer = renderer.create(<HelloWave />);
    });
    await flushPromises(3);
    return testRenderer!.root;
  }

  it('shows a sign-in prompt for signed-out IBM Hardware mode', async () => {
    const root = await renderAnimation();

    const hardwareButton = findPressableByText(root, 'IBM Hardware');
    expect(hardwareButton).toBeDefined();

    await act(async () => {
      hardwareButton?.props.onPress();
    });
    await flushPromises(2);

    expect(findNodesByText(root, 'Sign in to use IBM Hardware').length).toBeGreaterThan(0);
    expect(mockListIbmBackends).not.toHaveBeenCalled();
    expect(mockSubmitIbmCircuitJob).not.toHaveBeenCalled();
  });

  it('shows a verified-profile requirement for signed-in users without verified IBM profiles', async () => {
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'supabase-token',
        user: { email: 'dj@example.com' },
      })
    );
    mockListIbmProfiles.mockResolvedValue([
      {
        profileId: 'profile-1',
        profileName: 'Unverified IBM',
        instance: 'crn:v1:test',
        channel: 'ibm_quantum_platform',
        maskedToken: 'tok_****',
        isDefault: true,
        verificationStatus: 'unverified',
      },
    ]);

    const root = await renderAnimation();

    await act(async () => {
      findPressableByText(root, 'IBM Hardware')?.props.onPress();
    });
    await flushPromises(4);

    expect(mockListIbmProfiles).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'supabase-token'
    );
    expect(findNodesByText(root, 'No verified IBM profiles yet').length).toBeGreaterThan(0);
  });

  it('disables hardware backend loading until a user API key is pasted', async () => {
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'supabase-token',
        user: { email: 'dj@example.com' },
      })
    );
    mockListIbmProfiles.mockResolvedValue([
      {
        profileId: 'profile-1',
        profileName: 'IBM Open',
        instance: 'crn:v1:test',
        channel: 'ibm_quantum_platform',
        maskedToken: 'tok_****',
        isDefault: true,
        verificationStatus: 'verified',
      },
    ]);

    const root = await renderAnimation();

    await act(async () => {
      findPressableByText(root, 'IBM Hardware')?.props.onPress();
    });
    await flushPromises(4);

    expect(findPressableByText(root, 'Refresh Backends')?.props.disabled).toBe(true);
    expect(findPressableByText(root, 'Run Now')?.props.disabled).toBe(true);
    expect(mockListIbmBackends).not.toHaveBeenCalled();
  });

  it('uses the pasted user API key and selected verified profile for IBM Hardware', async () => {
    mockGetSupabaseBrowserClient.mockReturnValue(
      createSupabaseClient({
        access_token: 'supabase-token',
        user: { email: 'dj@example.com' },
      })
    );
    mockListIbmProfiles.mockResolvedValue([
      {
        profileId: 'profile-1',
        profileName: 'IBM Open',
        instance: 'crn:v1:test',
        channel: 'ibm_quantum_platform',
        maskedToken: 'tok_****',
        isDefault: true,
        verificationStatus: 'verified',
      },
    ]);

    const root = await renderAnimation();

    await act(async () => {
      findPressableByText(root, 'IBM Hardware')?.props.onPress();
    });
    await flushPromises(4);

    const keyInput = findTextInputByPlaceholder(root, 'Paste Quantum API key secret');
    expect(keyInput).toBeDefined();

    await act(async () => {
      keyInput?.props.onChangeText('qk_user_123');
    });
    await flushPromises(2);

    await act(async () => {
      findPressableByText(root, 'Refresh Backends')?.props.onPress();
    });
    await flushPromises(3);

    expect(mockListIbmBackends).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'qk_user_123',
      {
        ibmProfile: 'IBM Open',
        minQubits: 1,
      }
    );

    await act(async () => {
      findPressableByText(root, 'Run Now')?.props.onPress();
    });
    await flushPromises(4);

    expect(mockSubmitIbmCircuitJob).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'qk_user_123',
      expect.objectContaining({
        backendName: 'ibm_brisbane',
        ibmProfile: 'IBM Open',
      })
    );
    expect(mockGetIbmCircuitJobResult).toHaveBeenCalledWith(
      'https://example.com/public-facing/api/quantum/v1',
      'qk_user_123',
      'job-1'
    );
  });
});
