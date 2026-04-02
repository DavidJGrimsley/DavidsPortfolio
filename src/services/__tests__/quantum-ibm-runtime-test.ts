import {
  getIbmCircuitJobResult,
  getIbmCircuitJobStatus,
  listIbmBackends,
  submitIbmCircuitJob,
} from '../quantum-ibm-runtime';

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function createMockResponse(body: string, init?: Partial<Pick<MockResponse, 'ok' | 'status'>>) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    text: jest.fn().mockResolvedValue(body),
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
});
