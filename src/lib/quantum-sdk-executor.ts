import { QuantumApiError as SdkQuantumApiError } from '@mr.dj2u/quantum-api';
import type { BackendProvider, ListBackendsOptions } from '@mr.dj2u/quantum-api';
import {
  createQuantumBearerClient,
  createQuantumPublicClient,
  createQuantumRuntimeProxyClient,
} from '@/lib/quantum-sdk-client';

export type QuantumSdkEndpointExecutionInput = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  baseUrl: string;
  body?: unknown;
  bearerToken?: string | null;
};

export type QuantumSdkEndpointExecutionResult = {
  status: number;
  statusText: string;
  data: unknown;
};

type RuntimePostHandler = (runtimeClient: ReturnType<typeof createQuantumRuntimeProxyClient>, body: unknown) => Promise<unknown>;

const RUNTIME_POST_HANDLERS: Record<string, RuntimePostHandler> = {
  '/gates/run': (runtimeClient, body) => runtimeClient.runGate((body ?? {}) as any, { auth: 'none' }),
  '/circuits/run': (runtimeClient, body) => runtimeClient.runCircuit((body ?? {}) as any, { auth: 'none' }),
  '/text/transform': (runtimeClient, body) =>
    runtimeClient.transformText((body ?? {}) as any, { auth: 'none' }),
  '/transpile': (runtimeClient, body) => runtimeClient.transpile((body ?? {}) as any, { auth: 'none' }),
  '/qasm/import': (runtimeClient, body) => runtimeClient.importQasm((body ?? {}) as any, { auth: 'none' }),
  '/qasm/export': (runtimeClient, body) => runtimeClient.exportQasm((body ?? {}) as any, { auth: 'none' }),
  '/jobs/circuits': (runtimeClient, body) =>
    runtimeClient.submitCircuitJob((body ?? {}) as any, { auth: 'none' }),
  '/algorithms/grover_search': (runtimeClient, body) =>
    runtimeClient.groverSearch((body ?? {}) as any, { auth: 'none' }),
  '/algorithms/amplitude_estimation': (runtimeClient, body) =>
    runtimeClient.amplitudeEstimation((body ?? {}) as any, { auth: 'none' }),
  '/algorithms/phase_estimation': (runtimeClient, body) =>
    runtimeClient.phaseEstimation((body ?? {}) as any, { auth: 'none' }),
  '/algorithms/time_evolution': (runtimeClient, body) =>
    runtimeClient.timeEvolution((body ?? {}) as any, { auth: 'none' }),
  '/optimization/qaoa': (runtimeClient, body) => runtimeClient.qaoa((body ?? {}) as any, { auth: 'none' }),
  '/optimization/vqe': (runtimeClient, body) => runtimeClient.vqe((body ?? {}) as any, { auth: 'none' }),
  '/optimization/maxcut': (runtimeClient, body) => runtimeClient.maxcut((body ?? {}) as any, { auth: 'none' }),
  '/optimization/knapsack': (runtimeClient, body) =>
    runtimeClient.knapsack((body ?? {}) as any, { auth: 'none' }),
  '/optimization/tsp': (runtimeClient, body) => runtimeClient.tsp((body ?? {}) as any, { auth: 'none' }),
  '/experiments/state_tomography': (runtimeClient, body) =>
    runtimeClient.stateTomography((body ?? {}) as any, { auth: 'none' }),
  '/experiments/randomized_benchmarking': (runtimeClient, body) =>
    runtimeClient.randomizedBenchmarking((body ?? {}) as any, { auth: 'none' }),
  '/experiments/quantum_volume': (runtimeClient, body) =>
    runtimeClient.quantumVolume((body ?? {}) as any, { auth: 'none' }),
  '/experiments/t1': (runtimeClient, body) => runtimeClient.t1((body ?? {}) as any, { auth: 'none' }),
  '/experiments/t2ramsey': (runtimeClient, body) =>
    runtimeClient.t2Ramsey((body ?? {}) as any, { auth: 'none' }),
  '/finance/portfolio_optimization': (runtimeClient, body) =>
    runtimeClient.portfolioOptimization((body ?? {}) as any, { auth: 'none' }),
  '/finance/portfolio_diversification': (runtimeClient, body) =>
    runtimeClient.portfolioDiversification((body ?? {}) as any, { auth: 'none' }),
  '/ml/kernel_classifier': (runtimeClient, body) =>
    runtimeClient.kernelClassifier((body ?? {}) as any, { auth: 'none' }),
  '/ml/vqc_classifier': (runtimeClient, body) =>
    runtimeClient.vqcClassifier((body ?? {}) as any, { auth: 'none' }),
  '/ml/qsvr_regressor': (runtimeClient, body) =>
    runtimeClient.qsvrRegressor((body ?? {}) as any, { auth: 'none' }),
  '/nature/ground_state_energy': (runtimeClient, body) =>
    runtimeClient.groundStateEnergy((body ?? {}) as any, { auth: 'none' }),
  '/nature/fermionic_mapping_preview': (runtimeClient, body) =>
    runtimeClient.fermionicMappingPreview((body ?? {}) as any, { auth: 'none' }),
};

function normalizeOperationPath(path: string, baseUrl: string) {
  let candidate = path.trim();

  if (/^https?:\/\//i.test(candidate)) {
    const parsed = new URL(candidate);
    candidate = `${parsed.pathname}${parsed.search}`;
  }

  const prefixes: string[] = [
    '/api/public/quantum/v1',
    '/api/public/quantum',
    '/public-facing/api/quantum/v1',
    '/public-facing/api/quantum',
  ];

  try {
    const parsedBase = new URL(baseUrl);
    const trimmedBasePath = parsedBase.pathname.replace(/\/+$/, '');
    if (trimmedBasePath.length > 0) {
      prefixes.push(trimmedBasePath);
      if (trimmedBasePath.endsWith('/v1')) {
        prefixes.push(trimmedBasePath.slice(0, -3));
      }
    }
  } catch {
    // Ignore invalid base URL parsing and fall back to canonical prefixes.
  }

  const uniquePrefixes = [...new Set(prefixes)].sort((a, b) => b.length - a.length);
  for (const prefix of uniquePrefixes) {
    if (!prefix) {
      continue;
    }

    if (candidate === prefix || candidate.startsWith(`${prefix}/`)) {
      candidate = candidate.slice(prefix.length) || '/';
      break;
    }
  }

  if (candidate === '/v1') {
    return '/';
  }

  if (candidate.startsWith('/v1/')) {
    candidate = candidate.slice(3);
  }

  return candidate.startsWith('/') ? candidate : `/${candidate}`;
}

function splitOperationPath(path: string) {
  const queryStart = path.indexOf('?');
  if (queryStart === -1) {
    return {
      pathname: path,
      searchParams: new URLSearchParams(),
    };
  }

  return {
    pathname: path.slice(0, queryStart) || '/',
    searchParams: new URLSearchParams(path.slice(queryStart + 1)),
  };
}

function readListBackendsOptions(searchParams: URLSearchParams): ListBackendsOptions {
  const providerValue = searchParams.get('provider')?.trim().toLowerCase();
  const simulatorOnly = searchParams.get('simulator_only')?.trim();
  const minQubits = searchParams.get('min_qubits')?.trim();
  const ibmProfile = searchParams.get('ibm_profile')?.trim();
  const parsedMinQubits = minQubits ? Number(minQubits) : NaN;
  const provider: BackendProvider =
    providerValue === 'ibm' || providerValue === 'aer' ? providerValue : 'aer';

  return {
    provider,
    simulator_only: simulatorOnly ? simulatorOnly.toLowerCase() === 'true' : true,
    ...(Number.isFinite(parsedMinQubits) ? { min_qubits: parsedMinQubits } : {}),
    ...(ibmProfile ? { ibm_profile: ibmProfile } : {}),
  };
}

function parseStatusText(status: number, code: string | undefined) {
  return code ? code.replace(/_/g, ' ') : `HTTP ${status}`;
}

function requireBearerClient(baseUrl: string, bearerToken?: string | null) {
  const token = bearerToken?.trim();
  if (!token) {
    throw new Error('Bearer auth is required for this endpoint. Sign in first.');
  }

  return createQuantumBearerClient(baseUrl, token);
}

export async function executeQuantumSdkEndpoint(
  input: QuantumSdkEndpointExecutionInput
): Promise<QuantumSdkEndpointExecutionResult> {
  const method = input.method.toUpperCase() as QuantumSdkEndpointExecutionInput['method'];
  const normalizedPath = normalizeOperationPath(input.path, input.baseUrl);
  const { pathname, searchParams } = splitOperationPath(normalizedPath);

  if (pathname.includes('{') || pathname.includes('}')) {
    throw new Error(`Cannot execute templated route ${pathname}. Provide a concrete resource identifier first.`);
  }

  const publicClient = createQuantumPublicClient(input.baseUrl);
  const runtimeClient = createQuantumRuntimeProxyClient(input.baseUrl);

  try {
    let data: unknown;

    if (method === 'GET' && pathname === '/health') {
      data = await publicClient.health({ auth: 'none' });
    } else if (method === 'GET' && pathname === '/portfolio.json') {
      data = await publicClient.portfolio({ auth: 'none' });
    } else if (method === 'GET' && pathname === '/echo-types') {
      data = await runtimeClient.echoTypes({ auth: 'none' });
    } else if (method === 'GET' && pathname === '/list_backends') {
      data = await runtimeClient.listBackends(readListBackendsOptions(searchParams), { auth: 'none' });
    } else if (method === 'GET' && pathname === '/keys') {
      data = await requireBearerClient(input.baseUrl, input.bearerToken).listKeys({ auth: 'bearer' });
    } else if (method === 'GET' && pathname === '/ibm/profiles') {
      data = await requireBearerClient(input.baseUrl, input.bearerToken).listIbmProfiles({ auth: 'bearer' });
    } else {
      const getJobStatusMatch = method === 'GET' ? pathname.match(/^\/jobs\/([^/]+)$/) : null;
      if (getJobStatusMatch) {
        data = await runtimeClient.getCircuitJob(decodeURIComponent(getJobStatusMatch[1] ?? ''), {
          auth: 'none',
        });
      } else {
        const getJobResultMatch = method === 'GET' ? pathname.match(/^\/jobs\/([^/]+)\/result$/) : null;
        if (getJobResultMatch) {
          data = await runtimeClient.getCircuitJobResult(decodeURIComponent(getJobResultMatch[1] ?? ''), {
            auth: 'none',
          });
        } else if (method === 'POST' && pathname === '/keys') {
          data = await requireBearerClient(input.baseUrl, input.bearerToken).createKey((input.body ?? {}) as any, {
            auth: 'bearer',
          });
        } else if (method === 'POST' && pathname === '/ibm/profiles') {
          data = await requireBearerClient(input.baseUrl, input.bearerToken).createIbmProfile((input.body ?? {}) as any, {
            auth: 'bearer',
          });
        } else {
          const postKeyActionMatch = method === 'POST' ? pathname.match(/^\/keys\/([^/]+)\/(revoke|rotate)$/) : null;
          if (postKeyActionMatch) {
            const keyId = decodeURIComponent(postKeyActionMatch[1] ?? '');
            data = postKeyActionMatch[2] === 'revoke'
              ? await requireBearerClient(input.baseUrl, input.bearerToken).revokeKey(keyId, { auth: 'bearer' })
              : await requireBearerClient(input.baseUrl, input.bearerToken).rotateKey(keyId, { auth: 'bearer' });
          } else {
            const verifyProfileMatch = method === 'POST'
              ? pathname.match(/^\/ibm\/profiles\/([^/]+)\/verify$/)
              : null;
            if (verifyProfileMatch) {
              data = await requireBearerClient(input.baseUrl, input.bearerToken).verifyIbmProfile(
                decodeURIComponent(verifyProfileMatch[1] ?? ''),
                { auth: 'bearer' }
              );
            } else {
              const cancelJobMatch = method === 'POST' ? pathname.match(/^\/jobs\/([^/]+)\/cancel$/) : null;
              if (cancelJobMatch) {
                data = await runtimeClient.cancelCircuitJob(decodeURIComponent(cancelJobMatch[1] ?? ''), {
                  auth: 'none',
                });
              } else if (method === 'PATCH') {
                const patchProfileMatch = pathname.match(/^\/ibm\/profiles\/([^/]+)$/);
                if (patchProfileMatch) {
                  data = await requireBearerClient(input.baseUrl, input.bearerToken).updateIbmProfile(
                    decodeURIComponent(patchProfileMatch[1] ?? ''),
                    (input.body ?? {}) as any,
                    { auth: 'bearer' }
                  );
                } else {
                  throw new Error(`Unsupported Quantum endpoint ${method} ${pathname}`);
                }
              } else if (method === 'DELETE') {
                if (pathname === '/keys/revoked') {
                  data = await requireBearerClient(input.baseUrl, input.bearerToken).deleteRevokedKeys({
                    auth: 'bearer',
                  });
                } else {
                  const deleteKeyMatch = pathname.match(/^\/keys\/([^/]+)$/);
                  const deleteProfileMatch = pathname.match(/^\/ibm\/profiles\/([^/]+)$/);
                  if (deleteKeyMatch) {
                    data = await requireBearerClient(input.baseUrl, input.bearerToken).deleteKey(
                      decodeURIComponent(deleteKeyMatch[1] ?? ''),
                      { auth: 'bearer' }
                    );
                  } else if (deleteProfileMatch) {
                    data = await requireBearerClient(input.baseUrl, input.bearerToken).deleteIbmProfile(
                      decodeURIComponent(deleteProfileMatch[1] ?? ''),
                      { auth: 'bearer' }
                    );
                  } else {
                    throw new Error(`Unsupported Quantum endpoint ${method} ${pathname}`);
                  }
                }
              } else if (method === 'POST') {
                const runtimeHandler = RUNTIME_POST_HANDLERS[pathname];
                if (!runtimeHandler) {
                  throw new Error(`Unsupported Quantum endpoint ${method} ${pathname}`);
                }
                data = await runtimeHandler(runtimeClient, input.body);
              } else {
                throw new Error(`Unsupported Quantum endpoint ${method} ${pathname}`);
              }
            }
          }
        }
      }
    }

    return {
      status: 200,
      statusText: 'OK',
      data,
    };
  } catch (error) {
    if (error instanceof SdkQuantumApiError) {
      return {
        status: error.status,
        statusText: parseStatusText(error.status, error.code),
        data:
          error.body ??
          (error.bodyText
            ? {
                message: error.message,
                details: error.details,
                body_text: error.bodyText,
              }
            : { message: error.message, details: error.details }),
      };
    }

    throw error;
  }
}
