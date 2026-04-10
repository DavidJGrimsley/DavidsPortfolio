import {
  getIbmCircuitJobResult,
  getIbmCircuitJobStatus,
  listIbmBackends,
  runQuantumGate,
  submitIbmCircuitJob,
} from '../quantum-ibm-runtime';

type MockResponse = {
  ok: boolean;
  status: number;
  headers: Headers;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

function createMockResponse(body: string, init?: Partial<Pick<MockResponse, 'ok' | 'status'>>) {
  const parseBody = () => {
    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body) as unknown;
    } catch {
      return body;
    }
  };

  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    headers: new Headers({
      'content-type': 'application/json',
    }),
    text: jest.fn().mockResolvedValue(body),
    json: jest.fn().mockResolvedValue(parseBody()),
  } as MockResponse;
}

describe('quantum ibm runtime service', () => {
  const fetchMock = jest.fn();
  const baseUrl = 'https://example.com/v1';
  const apiKey = 'qk_test_123';

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('lists and normalizes ibm hardware backends', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          backends: [
            {
              name: 'ibm_kyiv',
              provider: 'ibm',
              is_simulator: false,
              is_hardware: true,
              num_qubits: 127,
              basis_gates: ['cx', 'rz'],
            },
            {
              name: 'ibm_simulator',
              provider: 'ibm',
              is_simulator: true,
              is_hardware: false,
              num_qubits: 32,
              basis_gates: ['cx'],
            },
          ],
        })
      )
    );

    await expect(listIbmBackends(baseUrl, apiKey, { ibmProfile: 'IBM Open' })).resolves.toEqual([
      {
        name: 'ibm_kyiv',
        provider: 'ibm',
        isSimulator: false,
        isHardware: true,
        numQubits: 127,
        basisGates: ['cx', 'rz'],
      },
    ]);
  });

  it('submits and normalizes ibm job lifecycle payloads', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            job_id: 'job-1',
            provider: 'ibm',
            backend_name: 'ibm_kyiv',
            ibm_profile: 'IBM Open',
            remote_job_id: 'remote-1',
            status: 'queued',
            created_at: '2026-04-02T12:00:00.000Z',
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            job_id: 'job-1',
            provider: 'ibm',
            backend_name: 'ibm_kyiv',
            ibm_profile: 'IBM Open',
            remote_job_id: 'remote-1',
            status: 'running',
            created_at: '2026-04-02T12:00:00.000Z',
            updated_at: '2026-04-02T12:00:05.000Z',
            completed_at: null,
            error: null,
          })
        )
      )
      .mockResolvedValueOnce(
        createMockResponse(
          JSON.stringify({
            job_id: 'job-1',
            status: 'succeeded',
            result: {
              num_qubits: 1,
              shots: 512,
              counts: { '0': 255, '1': 257 },
            },
          })
        )
      );

    await expect(
      submitIbmCircuitJob(baseUrl, apiKey, {
        backendName: 'ibm_kyiv',
        ibmProfile: 'IBM Open',
        shots: 512,
        circuit: {
          numQubits: 1,
          operations: [{ gate: 'h', target: 0 }],
        },
      })
    ).resolves.toMatchObject({
      jobId: 'job-1',
      status: 'queued',
    });

    await expect(getIbmCircuitJobStatus(baseUrl, apiKey, 'job-1')).resolves.toMatchObject({
      jobId: 'job-1',
      status: 'running',
    });

    await expect(getIbmCircuitJobResult(baseUrl, apiKey, 'job-1')).resolves.toEqual({
      jobId: 'job-1',
      status: 'succeeded',
      result: {
        numQubits: 1,
        shots: 512,
        counts: { '0': 255, '1': 257 },
      },
    });
  });

  it('routes api-key protected runtime calls through the proxy path', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          gate_type: 'rotation',
          measurement: 1,
          superposition_strength: 0.875,
          success: true,
          backend: 'Qiskit Aer simulator',
        })
      )
    );

    await expect(
      runQuantumGate('https://example.com/public-facing/api/quantum/v1', apiKey, {
        gateType: 'rotation',
        rotationAngleRad: Math.PI / 2,
      })
    ).resolves.toMatchObject({
      gateType: 'rotation',
      measurement: 1,
      superpositionStrength: 0.875,
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const calledHeaders = new Headers(calledInit.headers);

    expect(calledUrl).toBe('https://example.com/api/quantum-backend/v1/gates/run');
    expect(calledInit.method).toBe('POST');
    expect(calledHeaders.get('Accept')).toBe('application/json');
    expect(calledHeaders.get('X-API-Key')).toBeNull();
  });

  it('surfaces invalid key errors from runtime calls', async () => {
    fetchMock.mockResolvedValue(
      createMockResponse(
        JSON.stringify({
          error: 'invalid_api_key',
          message: 'Quantum API key rejected (401). Create or rotate an active key and retry.',
        }),
        {
          ok: false,
          status: 401,
        }
      )
    );

    await expect(
      runQuantumGate(baseUrl, apiKey, {
        gateType: 'bit_flip',
      })
    ).rejects.toMatchObject({
      name: 'QuantumApiError',
      status: 401,
    });
  });
});
