import { QuantumApiError as SdkQuantumApiError } from '@mr.dj2u/quantum-api';
import { createQuantumRuntimeProxyClient } from '@/lib/quantum-sdk-client';
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

export type QuantumGateRunInput = {
  gateType: 'bit_flip' | 'phase_flip' | 'rotation';
  rotationAngleRad?: number;
};

export type QuantumGateRunResult = {
  gateType: 'bit_flip' | 'phase_flip' | 'rotation';
  measurement: 0 | 1;
  superpositionStrength: number;
  success: boolean;
  backend?: string | null;
};

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

function normalizeRuntimePath(path: string) {
  const trimmed = path.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname === '/v1'
      ? '/'
      : parsed.pathname.startsWith('/v1/')
        ? parsed.pathname.slice(3)
        : parsed.pathname;

    return {
      pathname: normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`,
      searchParams: parsed.searchParams,
    };
  }

  const [pathPart, queryPart] = trimmed.split('?', 2);
  const withLeadingSlash = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const normalizedPath = withLeadingSlash === '/v1'
    ? '/'
    : withLeadingSlash.startsWith('/v1/')
      ? withLeadingSlash.slice(3)
      : withLeadingSlash;

  return {
    pathname: normalizedPath,
    searchParams: new URLSearchParams(queryPart ?? ''),
  };
}

function parseRequestBody(body: BodyInit | null | undefined) {
  if (!body) {
    return undefined;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? readJsonOrText(trimmed) : undefined;
  }

  return body;
}

function toRuntimeQuantumApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof QuantumApiError) {
    return error;
  }

  if (error instanceof SdkQuantumApiError) {
    const parsedBody = asObject(readJsonOrText(error.bodyText));
    const details = parsedBody ?? error.body ?? error.details ?? null;
    const fallbackStatusMessage =
      error.status === 401
        ? 'Quantum API key rejected (401). Create or rotate an active key and retry.'
        : fallbackMessage;

    return new QuantumApiError(
      getErrorMessage(details, error.message || fallbackStatusMessage),
      error.status,
      details
    );
  }

  if (error instanceof Error) {
    const status = /api key/i.test(error.message) ? 401 : 500;
    const fallbackStatusMessage =
      status === 401
        ? 'Quantum API key rejected (401). Create or rotate an active key and retry.'
        : fallbackMessage;
    return new QuantumApiError(error.message || fallbackStatusMessage, status, {
      message: error.message,
    });
  }

  return new QuantumApiError(fallbackMessage, 500, error);
}

async function requestQuantumApiWithApiKey(
  baseUrl: string,
  _apiKey: string,
  path: string,
  init?: RequestInit
) {
  const client = createQuantumRuntimeProxyClient(baseUrl);
  const method = (init?.method ?? 'GET').toUpperCase();
  const { pathname, searchParams } = normalizeRuntimePath(path);
  const parsedBody = asObject(parseRequestBody(init?.body));
  const runtimeOptions = {
    auth: 'none' as const,
    headers: {
      Accept: 'application/json',
    },
  };

  try {
    if (method === 'GET' && pathname === '/list_backends') {
      const provider = asString(searchParams.get('provider'));
      const simulatorOnly = asString(searchParams.get('simulator_only'));
      const minQubits = asString(searchParams.get('min_qubits'));
      const ibmProfile = asString(searchParams.get('ibm_profile'));
      const parsedMinQubits = minQubits ? Number(minQubits) : NaN;

      return await client.listBackends(
        {
          ...(provider ? { provider: provider as 'ibm' | 'aer' } : {}),
          ...(simulatorOnly ? { simulator_only: simulatorOnly === 'true' } : {}),
          ...(Number.isFinite(parsedMinQubits) ? { min_qubits: parsedMinQubits } : {}),
          ...(ibmProfile ? { ibm_profile: ibmProfile } : {}),
        },
        runtimeOptions
      );
    }

    if (method === 'POST' && pathname === '/gates/run') {
      return await client.runGate((parsedBody ?? {}) as any, runtimeOptions);
    }

    if (method === 'POST' && pathname === '/jobs/circuits') {
      return await client.submitCircuitJob((parsedBody ?? {}) as any, runtimeOptions);
    }

    const jobStatusMatch = pathname.match(/^\/jobs\/([^/]+)$/);
    if (method === 'GET' && jobStatusMatch) {
      return await client.getCircuitJob(decodeURIComponent(jobStatusMatch[1] ?? ''), {
        ...runtimeOptions,
      });
    }

    const jobResultMatch = pathname.match(/^\/jobs\/([^/]+)\/result$/);
    if (method === 'GET' && jobResultMatch) {
      return await client.getCircuitJobResult(decodeURIComponent(jobResultMatch[1] ?? ''), {
        ...runtimeOptions,
      });
    }

    const jobCancelMatch = pathname.match(/^\/jobs\/([^/]+)\/cancel$/);
    if (method === 'POST' && jobCancelMatch) {
      return await client.cancelCircuitJob(decodeURIComponent(jobCancelMatch[1] ?? ''), {
        ...runtimeOptions,
      });
    }

    throw new QuantumApiError(
      `Unsupported Quantum runtime route: ${method} ${pathname}.`,
      400,
      { method, path: pathname }
    );
  } catch (error) {
    throw toRuntimeQuantumApiError(error, 'Unable to complete the Quantum runtime request.');
  }
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

function normalizeGateRunResponse(payload: unknown): QuantumGateRunResult {
  const record = asObject(payload);
  const gateType = pickString(record, 'gate_type', 'gateType');

  return {
    gateType:
      gateType === 'bit_flip' || gateType === 'phase_flip' || gateType === 'rotation'
        ? gateType
        : 'rotation',
    measurement: asNumber(record?.measurement) === 1 ? 1 : 0,
    superpositionStrength: Math.max(
      0,
      Math.min(1, asNumber(record?.superposition_strength ?? record?.superpositionStrength) ?? 0)
    ),
    success: asBoolean(record?.success) ?? true,
    backend: pickString(record, 'backend', 'backend_name', 'backendName'),
  };
}

export async function runQuantumGate(baseUrl: string, apiKey: string, input: QuantumGateRunInput) {
  const payload = await requestQuantumApiWithApiKey(baseUrl, apiKey, '/gates/run', {
    method: 'POST',
    body: JSON.stringify({
      gate_type: input.gateType,
      ...(typeof input.rotationAngleRad === 'number'
        ? { rotation_angle_rad: input.rotationAngleRad }
        : {}),
    }),
  });

  return normalizeGateRunResponse(payload);
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
