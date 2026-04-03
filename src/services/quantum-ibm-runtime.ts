import { QuantumApiError } from './quantum-key-management';

type JsonObject = Record<string, unknown>;

export type QuantumCircuitOperation = {
  gate: 'x' | 'z' | 'h' | 'ry' | 'cx';
  target: number;
  theta?: number;
  control?: number;
};

export type QuantumCircuitDefinition = {
  numQubits: number;
  operations: QuantumCircuitOperation[];
};

export type IbmBackendRecord = {
  name: string;
  provider: 'ibm' | 'aer';
  isSimulator: boolean;
  isHardware: boolean;
  numQubits: number;
  basisGates: string[];
};

export type IbmCircuitJobSubmitInput = {
  backendName: string;
  circuit: QuantumCircuitDefinition;
  ibmProfile?: string | null;
  shots?: number;
};

export type IbmCircuitJobSubmitResult = {
  jobId: string;
  provider: 'ibm';
  backendName: string;
  ibmProfile?: string | null;
  remoteJobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelling' | 'cancelled';
  createdAt?: string | null;
};

export type IbmCircuitJobStatusResult = {
  jobId: string;
  provider: 'ibm';
  backendName: string;
  ibmProfile?: string | null;
  remoteJobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelling' | 'cancelled';
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export type IbmCircuitJobResult = {
  jobId: string;
  status: 'succeeded';
  result: {
    numQubits: number;
    shots: number;
    counts: Record<string, number>;
  };
};

function joinUrl(baseUrl: string, path: string) {
  const trimmedPath = path.trim();
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  const baseMatch = normalizedBase.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);

  if (!baseMatch) {
    return `${normalizedBase}${normalizedPath}`;
  }

  const origin = baseMatch[1];
  const basePath = baseMatch[2] ?? '';

  if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
    return `${origin}${normalizedPath}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

function asString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function pickString(source: JsonObject | null, ...keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return null;
}

function readJsonOrText(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function parseResponse(response: Response) {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }
  return readJsonOrText(rawText);
}

function getErrorMessage(payload: unknown, fallback: string) {
  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return typeof payload === 'string' && payload.length > 0 ? payload : fallback;
  }

  return (
    pickString(objectPayload, 'detail', 'message', 'error', 'description') ??
    fallback
  );
}

async function requestQuantumApiWithApiKey(
  baseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers: {
      Accept: 'application/json',
      'X-API-Key': apiKey,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      response.status === 401
        ? 'Quantum API key rejected (401). Create or rotate an active key and retry.'
        : `Request failed with HTTP ${response.status}.`;

    throw new QuantumApiError(
      getErrorMessage(payload, fallbackMessage),
      response.status,
      payload
    );
  }

  return payload;
}

function extractCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const objectPayload = asObject(payload);
  if (!objectPayload) {
    return [];
  }

  const direct =
    (Array.isArray(objectPayload.backends) && objectPayload.backends) ||
    (Array.isArray(objectPayload.items) && objectPayload.items) ||
    (Array.isArray(objectPayload.results) && objectPayload.results) ||
    [];

  if (direct.length > 0) {
    return direct;
  }

  const nestedData = asObject(objectPayload.data);
  if (!nestedData) {
    return [];
  }

  return (
    (Array.isArray(nestedData.backends) && nestedData.backends) ||
    (Array.isArray(nestedData.items) && nestedData.items) ||
    (Array.isArray(nestedData.results) && nestedData.results) ||
    []
  );
}

function normalizeBackend(input: unknown): IbmBackendRecord | null {
  const record = asObject(input);
  if (!record) {
    return null;
  }

  const name = pickString(record, 'name');
  if (!name) {
    return null;
  }

  const basisGatesRaw = Array.isArray(record.basis_gates)
    ? record.basis_gates
    : Array.isArray(record.basisGates)
      ? record.basisGates
      : [];

  return {
    name,
    provider: pickString(record, 'provider') === 'aer' ? 'aer' : 'ibm',
    isSimulator: asBoolean(record.is_simulator ?? record.isSimulator) ?? false,
    isHardware: asBoolean(record.is_hardware ?? record.isHardware) ?? false,
    numQubits: asNumber(record.num_qubits ?? record.numQubits) ?? 0,
    basisGates: basisGatesRaw
      .map((gate) => asString(gate))
      .filter((gate): gate is string => Boolean(gate)),
  };
}

function normalizeJobStatus(value: string | null) {
  if (
    value === 'queued' ||
    value === 'running' ||
    value === 'succeeded' ||
    value === 'failed' ||
    value === 'cancelling' ||
    value === 'cancelled'
  ) {
    return value;
  }
  return 'queued';
}

function normalizeJobSubmitResponse(payload: unknown): IbmCircuitJobSubmitResult {
  const record = asObject(payload);
  return {
    jobId: pickString(record, 'job_id', 'jobId') ?? '',
    provider: 'ibm',
    backendName: pickString(record, 'backend_name', 'backendName') ?? '',
    ibmProfile: pickString(record, 'ibm_profile', 'ibmProfile'),
    remoteJobId: pickString(record, 'remote_job_id', 'remoteJobId') ?? '',
    status: normalizeJobStatus(pickString(record, 'status')),
    createdAt: pickString(record, 'created_at', 'createdAt'),
  };
}

function normalizeJobStatusResponse(payload: unknown): IbmCircuitJobStatusResult {
  const record = asObject(payload);
  const errorObject = asObject(record?.error);

  return {
    jobId: pickString(record, 'job_id', 'jobId') ?? '',
    provider: 'ibm',
    backendName: pickString(record, 'backend_name', 'backendName') ?? '',
    ibmProfile: pickString(record, 'ibm_profile', 'ibmProfile'),
    remoteJobId: pickString(record, 'remote_job_id', 'remoteJobId') ?? '',
    status: normalizeJobStatus(pickString(record, 'status')),
    createdAt: pickString(record, 'created_at', 'createdAt'),
    updatedAt: pickString(record, 'updated_at', 'updatedAt'),
    completedAt: pickString(record, 'completed_at', 'completedAt'),
    errorMessage: pickString(errorObject, 'message', 'detail'),
  };
}

function normalizeJobResultResponse(payload: unknown): IbmCircuitJobResult {
  const record = asObject(payload);
  const result = asObject(record?.result);
  const countsSource = asObject(result?.counts) ?? {};
  const counts: Record<string, number> = {};

  for (const [key, value] of Object.entries(countsSource)) {
    const numValue = asNumber(value);
    if (numValue !== null) {
      counts[key] = numValue;
    }
  }

  return {
    jobId: pickString(record, 'job_id', 'jobId') ?? '',
    status: 'succeeded',
    result: {
      numQubits: asNumber(result?.num_qubits ?? result?.numQubits) ?? 0,
      shots: asNumber(result?.shots) ?? 0,
      counts,
    },
  };
}

export async function listIbmBackends(
  baseUrl: string,
  apiKey: string,
  options?: { ibmProfile?: string | null; minQubits?: number }
) {
  const query = new URLSearchParams();
  query.set('provider', 'ibm');
  query.set('simulator_only', 'false');

  if (typeof options?.minQubits === 'number' && options.minQubits > 0) {
    query.set('min_qubits', String(Math.floor(options.minQubits)));
  }

  if (typeof options?.ibmProfile === 'string' && options.ibmProfile.trim().length > 0) {
    query.set('ibm_profile', options.ibmProfile.trim());
  }

  const payload = await requestQuantumApiWithApiKey(
    baseUrl,
    apiKey,
    `/list_backends?${query.toString()}`,
    {
      method: 'GET',
    }
  );

  return extractCollection(payload)
    .map((item) => normalizeBackend(item))
    .filter((item): item is IbmBackendRecord => item !== null)
    .filter((backend) => backend.provider === 'ibm' && backend.isHardware);
}

export async function submitIbmCircuitJob(
  baseUrl: string,
  apiKey: string,
  input: IbmCircuitJobSubmitInput
) {
  const payload = await requestQuantumApiWithApiKey(baseUrl, apiKey, '/jobs/circuits', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'ibm',
      backend_name: input.backendName,
      circuit: {
        num_qubits: input.circuit.numQubits,
        operations: input.circuit.operations,
      },
      shots: input.shots ?? 1024,
      ...(input.ibmProfile?.trim() ? { ibm_profile: input.ibmProfile.trim() } : {}),
    }),
  });

  return normalizeJobSubmitResponse(payload);
}

export async function getIbmCircuitJobStatus(baseUrl: string, apiKey: string, jobId: string) {
  const payload = await requestQuantumApiWithApiKey(
    baseUrl,
    apiKey,
    `/jobs/${encodeURIComponent(jobId)}`,
    {
      method: 'GET',
    }
  );

  return normalizeJobStatusResponse(payload);
}

export async function getIbmCircuitJobResult(baseUrl: string, apiKey: string, jobId: string) {
  const payload = await requestQuantumApiWithApiKey(
    baseUrl,
    apiKey,
    `/jobs/${encodeURIComponent(jobId)}/result`,
    {
      method: 'GET',
    }
  );

  return normalizeJobResultResponse(payload);
}

export async function cancelIbmCircuitJob(baseUrl: string, apiKey: string, jobId: string) {
  const payload = await requestQuantumApiWithApiKey(
    baseUrl,
    apiKey,
    `/jobs/${encodeURIComponent(jobId)}/cancel`,
    {
      method: 'POST',
    }
  );

  return normalizeJobStatusResponse(payload);
}
