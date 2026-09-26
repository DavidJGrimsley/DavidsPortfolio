export type BackendDiscoveryOptions = {
  provider: 'aer' | 'ibm';
  simulatorOnly: boolean;
  minQubits: string;
};

export function buildListBackendsPath(path: string, options: BackendDiscoveryOptions) {
  const [pathname, existingQuery = ''] = path.split('?', 2);
  const query = new URLSearchParams(existingQuery);
  const minQubits = options.minQubits.trim();

  if (minQubits && (!/^[1-9]\d*$/.test(minQubits) || !Number.isSafeInteger(Number(minQubits)))) {
    throw new Error('min_qubits must be an integer of at least 1.');
  }

  query.set('provider', options.provider);
  query.set('simulator_only', String(options.simulatorOnly));
  if (minQubits) {
    query.set('min_qubits', minQubits);
  } else {
    query.delete('min_qubits');
  }

  query.delete('ibm_profile');

  return `${pathname}?${query.toString()}`;
}
