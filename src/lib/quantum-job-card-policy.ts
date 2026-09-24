import type { PortfolioEndpoint } from '@/types/registry';

export const QUANTUM_JOB_CARD_NOTE =
  'This job endpoint cannot be run from this page. For a guided IBM circuit run, use the Quantum Animation below. To make other job calls, use an API client such as Postman or Thunder Client.';

export function isQuantumJobCard(endpoint: PortfolioEndpoint, isQuantumRoute: boolean) {
  if (!isQuantumRoute) return false;
  const path = endpoint.operationPath ?? endpoint.path;
  return /\/v1\/jobs(?:\/|$)/.test(path.split('?')[0]);
}
