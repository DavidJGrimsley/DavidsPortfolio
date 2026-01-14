import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { ThemedText } from '../UI/ThemedText';

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#11181C',
}));

it(`renders correctly`, () => {
  let testRenderer: renderer.ReactTestRenderer | null = null;
  act(() => {
    testRenderer = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
  });

  if (!testRenderer) {
    throw new Error('ThemedText did not render');
  }

  const textNode = testRenderer.root.findByType(Text);
  expect(textNode.props.children).toBe('Snapshot test!');
  expect(textNode.props.className).toContain('text-themed');
});
