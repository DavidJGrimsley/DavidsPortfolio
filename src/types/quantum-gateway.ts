export type QuantumGatewayProjectStatus = 'active' | 'paused' | 'archived';

export type QuantumGatewayProjectRecord = {
  id: string;
  ownerUserId: string;
  projectSlug: string;
  displayName: string;
  status: QuantumGatewayProjectStatus;
  endpointPathPrefix: string;
  defaultApiKeyId?: string | null;
  defaultIbmCredentialProfileId?: string | null;
  routeAllowlist: string[];
  defaultRateLimitPerMinute: number;
  dailyRequestQuota: number;
  allowedOrigins: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type QuantumGatewayPublishableKeyStatus = 'active' | 'revoked' | 'rotated';

export type QuantumGatewayPublishableKeyRecord = {
  keyId: string;
  projectSlug?: string | null;
  label: string;
  maskedKey: string;
  status: QuantumGatewayPublishableKeyStatus;
  createdAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
};

export type QuantumGatewayProjectInput = {
  projectSlug: string;
  displayName: string;
  status: QuantumGatewayProjectStatus;
  endpointPathPrefix: string;
  defaultApiKeyId?: string | null;
  defaultIbmCredentialProfileId?: string | null;
  routeAllowlist: string[];
  defaultRateLimitPerMinute: number;
  dailyRequestQuota: number;
  allowedOrigins: string[];
};

export type QuantumGatewayProjectMutationResult = {
  project: QuantumGatewayProjectRecord | null;
  message?: string;
};

export type QuantumGatewayPublishableKeyInput = {
  label: string;
};

export type QuantumGatewayPublishableKeyMutationResult = {
  key: QuantumGatewayPublishableKeyRecord | null;
  rawKey: string | null;
  previousKey?: QuantumGatewayPublishableKeyRecord | null;
  newKey?: QuantumGatewayPublishableKeyRecord | null;
  secretVisibleOnce?: boolean;
  message?: string;
};

export type QuantumGatewayRuntimeSessionResult = {
  token: string | null;
  expiresAt?: string | null;
  projectId?: string | null;
  message?: string;
};

export type QuantumGatewayProjectsLoadResult = {
  source: 'gateway' | 'static';
  projects: QuantumGatewayProjectRecord[];
  requiresAuth: boolean;
  message?: string;
};

export type CreateQuantumGatewayProjectInput = {
  ownerUserId: string;
  projectSlug: string;
  displayName: string;
  endpointPathPrefix: string;
  status?: QuantumGatewayProjectStatus;
  defaultApiKeyId?: string | null;
  defaultIbmCredentialProfileId?: string | null;
  routeAllowlist?: string[];
  defaultRateLimitPerMinute?: number;
  dailyRequestQuota?: number;
  allowedOrigins?: string[];
};

export type UpdateQuantumGatewayProjectInput = {
  id: string;
  ownerUserId: string;
  projectSlug: string;
  displayName: string;
  endpointPathPrefix: string;
  status?: QuantumGatewayProjectStatus;
  defaultApiKeyId?: string | null;
  defaultIbmCredentialProfileId?: string | null;
  routeAllowlist?: string[];
  defaultRateLimitPerMinute?: number;
  dailyRequestQuota?: number;
  allowedOrigins?: string[];
};
