import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { ThemedText } from '../UI/ThemedText';

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#11181C',
}));

it(`renders correctly`, () => {
  let testRenderer!: renderer.ReactTestRenderer;
  act(() => {
    testRenderer = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
  });

  const textNode = testRenderer.root.findByType(Text as any);
  expect(textNode.props.children).toBe('Snapshot test!');
  expect(textNode.props.className).toContain('text-themed');
});
