import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HorizontalLinks } from '../HorizontalLinks';
import { OtherSectionsLinks } from '../OtherSectionsLinks';

jest.mock('expo-router', () => ({ Link: 'PortfolioLink' }));
jest.mock('@/components/UI/ExternalLink', () => ({ ExternalLink: 'ExternalLink' }));
jest.mock('@/components/UI/ThemedText', () => ({ ThemedText: 'ThemedText' }));

it('renders explicit Quantum API and canonical portfolio destinations as accessible links', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<OtherSectionsLinks otherSections={[
      { category: 'mobile-apps', title: 'guess-the-qubit-ar', caption: 'Try the AR version' },
      { category: 'public-facing/api', title: 'quantum', caption: 'Explore Quantum API', href: '/public-facing/api/quantum' },
      { category: 'website-development', title: 'Quantum Jam 2025: Echoes of Light', caption: 'Visit the jam website' },
    ]} />);
  });
  const links = tree.root.findAllByType('PortfolioLink' as any);
  expect(links.map(node => node.props.href)).toEqual([
    '/portfolio/mobile-apps/guess-the-qubit-ar',
    '/public-facing/api/quantum',
    '/portfolio/website-development/Quantum%20Jam%202025%3A%20Echoes%20of%20Light',
  ]);
  expect(links.map(node => node.props.accessibilityLabel)).toEqual(['Try the AR version', 'Explore Quantum API', 'Visit the jam website']);
  act(() => tree.unmount());
});

it('keeps legacy links and exposes labeled TestFlight, download, and submission destinations', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<HorizontalLinks github="https://github.com/DavidJGrimsley/xr-showcase" site="https://example.com/info" steam="https://example.com/play" links={[
      { label: 'Try the prototype on TestFlight', url: 'https://testflight.apple.com/join/4UugyD8Y' },
      { label: 'Download Windows demo', url: 'https://example.com/demo.zip' },
    ]} />);
  });
  const links = tree.root.findAllByType('ExternalLink' as any);
  expect(links.map(node => [node.props.accessibilityLabel, node.props.href])).toEqual([
    ['GitHub', 'https://github.com/DavidJGrimsley/xr-showcase'],
    ['Info Website', 'https://example.com/info'],
    ['See it here!', 'https://example.com/play'],
    ['Try the prototype on TestFlight', 'https://testflight.apple.com/join/4UugyD8Y'],
    ['Download Windows demo', 'https://example.com/demo.zip'],
  ]);
  expect(links.every(node => node.props.children.props.children === node.props.accessibilityLabel)).toBe(true);
  act(() => tree.unmount());
});
