import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HighlightImageCarousel } from '../HighlightImageCarousel';
import { PortfolioVideo } from '../PortfolioVideo.web';

jest.mock('expo-image', () => ({ Image: 'ProjectImage' }));
jest.mock('@/components/UI/ThemedText', () => ({ ThemedText: 'ThemedText' }));

it('lets the reader select a screenshot and updates its description', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<HighlightImageCarousel title="Anatomy preparation" pictures={['/skull.webp', '/brain.webp']} descriptions={['Skull cleanup in 3D Slicer.', 'Aligned brain and CT scan.']} />);
  });
  expect(tree.root.findByType('ProjectImage' as any).props.accessibilityLabel).toBe('Skull cleanup in 3D Slicer.');
  const button = () => tree.root.findByProps({ accessibilityLabel: 'Show Anatomy preparation image 2' });
  act(() => button().props.onPress());
  expect(tree.root.findByType('ProjectImage' as any).props.source.uri).toBe('/brain.webp');
  expect(tree.root.findByType('ProjectImage' as any).props.accessibilityLabel).toBe('Aligned brain and CT scan.');
  expect(button().props.accessibilityState.selected).toBe(true);
  act(() => tree.unmount());
});

it('embeds a titled web video without the native message-bridge wrapper', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<PortfolioVideo videoId="EUcPGIPwvgI" title="Quasicombo" width={640} height={360} />);
  });
  const iframe = tree.root.findByType('iframe');
  expect(iframe.props.src).toBe('https://www.youtube-nocookie.com/embed/EUcPGIPwvgI');
  expect(iframe.props.title).toBe('Quasicombo video');
  expect(iframe.props.loading).toBe('lazy');
  expect(iframe.props.allowFullScreen).toBe(true);
  expect(iframe.props.style.width).toBe('100%');
  expect(iframe.parent!.props.style.aspectRatio).toBe('16 / 9');
  act(() => tree.unmount());
});
