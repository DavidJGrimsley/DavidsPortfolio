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
    id: 'identerest-account',
    title: 'Identerest account sign in',
    description:
      'Users sign in once with an Identerest account. The same session can manage Gateway projects, Quantum API keys, and IBM credential profiles.',
    icon: 'person-circle-outline',
    status: 'Connected to Identerest',
  },
  {
    id: 'gateway-projects',
    title: 'Gateway project routing',
    description:
      'Choose the default Quantum API key, IBM profile, origins, and limits for each Gateway project.',
    icon: 'key-outline',
    status: 'Backed by Gateway management API',
  },
  {
    id: 'publishable-keys',
    title: 'Publishable Gateway client keys',
    description:
      'Create, rotate, and revoke publishable Gateway client keys that mint short-lived runtime tokens.',
    icon: 'hardware-chip-outline',
    status: 'Visible once on create or rotate',
  },
  {
    id: 'runtime-token',
    title: 'Runtime token flow',
    description:
      'Public clients exchange a publishable Gateway client key for a short-lived runtime token before calling Gateway runtime routes.',
    icon: 'analytics-outline',
    status: 'Bearer auth for runtime calls',
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
        value: 'echoes-of-light',
        hint: 'Unique per Identerest account',
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
    description: 'Attach existing Quantum API keys and IBM credential profiles without duplicating secret storage.',
    rows: [
      {
        id: 'primary-api-key',
        label: 'Default Quantum API key',
        value: 'Select per Gateway project',
      },
      {
        id: 'ibm-default',
        label: 'Default IBM profile',
        value: 'Select per Gateway project',
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
  'Identerest account auth is the owner identity for Gateway project management.',
  'Quantum API remains the source of truth for Quantum API keys and IBM credential profiles.',
  'Gateway projects store only references to default credentials and runtime limits.',
  'Public runtime calls use publishable Gateway client keys plus short-lived runtime tokens.',
];
