export type QuantumGatewayHighlight = {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: string;
};

export type QuantumGatewaySettingRow = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type QuantumGatewaySettingsSection = {
  id: string;
  title: string;
  description: string;
  rows: QuantumGatewaySettingRow[];
};

export type QuantumGatewayQuickAction = {
  id: string;
  label: string;
  route: string;
  icon: string;
};

export const quantumGatewayHighlights: QuantumGatewayHighlight[] = [
  {
    id: 'single-account',
    title: 'Single account identity',
    description:
      'Users sign in once with Identerest. The same account owner_user_id is used across Quantum API, Gateway, Creatisphere, and Higher.',
    icon: 'person-circle-outline',
    status: 'Connected to Identerest',
  },
  {
    id: 'api-keys',
    title: 'Quantum API key mapping',
    description:
      'Choose the default Quantum API key each gateway project should use. The key records still live in Quantum API tables.',
    icon: 'key-outline',
    status: 'Backed by identerest.quantum-api.api-keys',
  },
  {
    id: 'ibm-profiles',
    title: 'IBM profile selection',
    description:
      'Select existing IBM credential profiles per project so hardware backends can be used without exposing tokens to clients.',
    icon: 'hardware-chip-outline',
    status: 'Backed by identerest.quantum-api.ibm-credential-profiles',
  },
  {
    id: 'usage',
    title: 'Project-level gateway controls',
    description:
      'Gateway stores project settings and default credential pointers while execution history remains managed by Quantum API workflows.',
    icon: 'analytics-outline',
    status: 'Project table under identerest.quantum-gateway',
  },
];

export const quantumGatewaySettingsSections: QuantumGatewaySettingsSection[] = [
  {
    id: 'routing',
    title: 'Project routing',
    description: 'How requests are mounted and forwarded through your gateway endpoint.',
    rows: [
      {
        id: 'slug',
        label: 'Project slug',
        value: 'pokemon-prod',
        hint: 'Unique per owner account',
      },
      {
        id: 'path-prefix',
        label: 'Path prefix',
        value: '/public-facing/api/quantum-gateway/v1',
        hint: 'Visible to your client apps',
      },
      {
        id: 'status',
        label: 'Project status',
        value: 'active',
      },
    ],
  },
  {
    id: 'limits',
    title: 'Limits and quotas',
    description: 'Per-project safety controls used by the runtime limiter middleware.',
    rows: [
      {
        id: 'rpm',
        label: 'Default rate limit per minute',
        value: '120 requests/min',
      },
      {
        id: 'daily',
        label: 'Daily request quota',
        value: '100000 requests/day',
      },
      {
        id: 'origins',
        label: 'Allowed origins',
        value: 'Configured per project',
      },
    ],
  },
  {
    id: 'credentials',
    title: 'Credential bindings',
    description: 'Attach existing API keys and IBM credential profiles without duplicating credential storage.',
    rows: [
      {
        id: 'primary-api-key',
        label: 'Primary Quantum API key',
        value: 'Set per project',
      },
      {
        id: 'ibm-default',
        label: 'Default IBM profile',
        value: 'Set per project',
      },
      {
        id: 'audit',
        label: 'Execution telemetry source',
        value: 'Quantum API execution jobs',
      },
    ],
  },
];

export const quantumGatewayQuickActions: QuantumGatewayQuickAction[] = [
  {
    id: 'manage-api',
    label: 'Open Quantum API page',
    route: '/(tabs)/public-facing/api/quantum',
    icon: 'nuclear-outline',
  },
  {
    id: 'contact',
    label: 'Request gateway setup help',
    route: '/(tabs)/contact',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'services',
    label: 'View related services',
    route: '/(tabs)/services',
    icon: 'construct-outline',
  },
];

export const quantumGatewayIntegrationNotes = [
  'Identerest is the account authority. Users keep one identity across all your products.',
  'Quantum API remains the source of truth for API keys and IBM credential profiles.',
  'Quantum Gateway stores project settings with default key/profile references.',
  'Portfolio UI can read from identerest-backed APIs without direct coupling to gateway runtime internals.',
];