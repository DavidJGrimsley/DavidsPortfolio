/** @jest-environment node */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { useWebStartupReady, WEB_READY_FALLBACK_MS } from '../use-web-startup-ready';

jest.useFakeTimers();

function Probe({ loaded, error }: { loaded: boolean; error: Error | null }) {
  const ready = useWebStartupReady(true, loaded, error);
  return <>{ready ? 'ready' : 'loading'}</>;
}

afterEach(() => {
  jest.clearAllTimers();
});

it('reveals the page when font loading never completes', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<Probe loaded={false} error={null} />); });
  expect(tree.toJSON()).toBe('loading');
  act(() => { jest.advanceTimersByTime(WEB_READY_FALLBACK_MS); });
  expect(tree.toJSON()).toBe('ready');
  act(() => tree.unmount());
});

it('reveals the page immediately when font loading fails', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<Probe loaded={false} error={new Error('font unavailable')} />); });
  expect(tree.toJSON()).toBe('ready');
  act(() => tree.unmount());
});

it('reveals the page when fonts have loaded', async () => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => { tree = renderer.create(<Probe loaded error={null} />); });
  expect(tree.toJSON()).toBe('ready');
  act(() => tree.unmount());
});
