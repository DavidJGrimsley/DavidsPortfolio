import { buildListBackendsPath } from '../quantum-list-backends-query';

describe('backend discovery query', () => {
  it('builds the initial Aer simulator request without optional parameters', () => {
    expect(buildListBackendsPath('/v1/list_backends', {
      provider: 'aer',
      simulatorOnly: true,
      minQubits: '',
    })).toBe('/v1/list_backends?provider=aer&simulator_only=true');
  });

  it('builds IBM discovery without a visitor profile or key', () => {
    const options = {
      provider: 'ibm' as const,
      simulatorOnly: false,
      minQubits: ' 5 ',
    };
    expect(buildListBackendsPath('/v1/list_backends', options)).toBe(
      '/v1/list_backends?provider=ibm&simulator_only=false&min_qubits=5'
    );
    expect(buildListBackendsPath('/v1/list_backends?ibm_profile=stale', {
      ...options,
      provider: 'aer',
    })).toBe('/v1/list_backends?provider=aer&simulator_only=false&min_qubits=5');
  });

  it.each(['0', '-1', '1.5', 'abc', '9007199254740992'])(
    'rejects invalid minimum qubits %s',
    (minQubits) => {
      expect(() => buildListBackendsPath('/v1/list_backends', {
        provider: 'aer',
        simulatorOnly: true,
        minQubits,
      })).toThrow('min_qubits must be an integer of at least 1.');
    }
  );

});
