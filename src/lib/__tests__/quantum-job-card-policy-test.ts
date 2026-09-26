import { isQuantumJobCard, QUANTUM_JOB_CARD_NOTE } from '../quantum-job-card-policy';

describe('Quantum job endpoint cards', () => {
  it.each([
    ['POST', '/v1/jobs/circuits'],
    ['POST', '/v1/jobs/qasm'],
    ['POST', '/v1/jobs/random'],
    ['GET', '/v1/jobs/{job_id}'],
    ['GET', '/v1/jobs/{job_id}/result'],
    ['POST', '/v1/jobs/{job_id}/cancel'],
  ])('disables %s %s on the Quantum page', (method, path) => {
    const endpoint = { method, path, operationPath: path, summary: 'Job' };
    expect(isQuantumJobCard(endpoint, true)).toBe(true);
    expect(isQuantumJobCard(endpoint, false)).toBe(false);
  });

  it('keeps non-job routes interactive', () => {
    expect(isQuantumJobCard({ method: 'POST', path: '/v1/random', summary: 'Random' }, true)).toBe(false);
    expect(QUANTUM_JOB_CARD_NOTE).toContain('Quantum Animation below');
  });
});
