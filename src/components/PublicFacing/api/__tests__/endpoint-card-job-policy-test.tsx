import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { EndpointCard } from '../APIComponents';
import { QUANTUM_JOB_CARD_NOTE } from '@/lib/quantum-job-card-policy';

jest.mock('@react-native-picker/picker', () => ({
  Picker: Object.assign(({ children }: { children?: React.ReactNode }) => children, {
    Item: () => null,
  }),
}));

describe('EndpointCard job testing policy', () => {
  it('shows the job note without a request button or automatic GET call', async () => {
    const requestExecutor = jest.fn();
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EndpointCard
          method="GET"
          path="/v1/jobs/{job_id}"
          summary="Get a job"
          baseUrl="https://example.com/v1"
          hideLiveTest
          liveDisabledReason={QUANTUM_JOB_CARD_NOTE}
          requestExecutor={requestExecutor}
        />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('Get a job');
    await act(async () => {
      tree!.root.findAll((node) => typeof node.props.onPress === 'function')[0].props.onPress();
    });
    const rendered = JSON.stringify(tree!.toJSON());
    expect(rendered).toContain(QUANTUM_JOB_CARD_NOTE);
    expect(rendered).not.toContain('Send Request');
    expect(requestExecutor).not.toHaveBeenCalled();
    act(() => tree!.unmount());
  });

  it('keeps a POST job documented without showing Try It Out', async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EndpointCard
          method="POST"
          path="/v1/jobs/qasm"
          summary="Submit a QASM job"
          baseUrl="https://example.com/v1"
          requestBody={{ description: 'QASM job payload', example: { qasm: 'OPENQASM 2.0;' } }}
          hideLiveTest
          liveDisabledReason={QUANTUM_JOB_CARD_NOTE}
        />
      );
    });
    await act(async () => {
      tree!.root.findAll((node) => typeof node.props.onPress === 'function')[0].props.onPress();
    });
    const rendered = JSON.stringify(tree!.toJSON());
    expect(rendered).toContain('QASM job payload');
    expect(rendered).toContain(QUANTUM_JOB_CARD_NOTE);
    expect(rendered).not.toContain('Try It Out');
    expect(rendered).not.toContain('Send Request');
    act(() => tree!.unmount());
  });
});

describe('EndpointCard backend discovery', () => {
  it('waits for Send Request before discovering Aer backends', async () => {
    const requestExecutor = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { backends: [] },
    });
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EndpointCard
          method="GET"
          path="/v1/list_backends"
          summary="List backends"
          baseUrl="https://example.com/v1"
          requestExecutor={requestExecutor}
        />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('List backends');
    await act(async () => {
      tree!.root.findAll((node) => typeof node.props.onPress === 'function')[0].props.onPress();
    });

    const expanded = JSON.stringify(tree!.toJSON());
    expect(expanded).toContain('Send Request');
    expect(expanded).toContain('Choose your filters');
    expect(expanded).not.toContain('Fetching live response');
    expect(requestExecutor).not.toHaveBeenCalled();

    await act(async () => {
      const sendButton = tree!.root.findAll((node) =>
        typeof node.props.onPress === 'function' &&
        node.findAll((child) => child.props.children === 'Send Request').length > 0
      )[0];
      sendButton.props.onPress();
    });

    expect(requestExecutor).toHaveBeenCalledTimes(1);
    expect(requestExecutor).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      path: '/v1/list_backends?provider=aer&simulator_only=true',
    }));
    expect(JSON.stringify(tree!.toJSON())).toContain('Response:');
    act(() => tree!.unmount());
  });
});
