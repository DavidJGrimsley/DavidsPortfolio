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

export type QuantumGatewayProjectsLoadResult = {
  source: 'supabase' | 'static';
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
