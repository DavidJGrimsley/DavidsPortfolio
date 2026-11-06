import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import Game from '../TicTacToe';
import { Text } from 'react-native';

describe('TicTacToe component', () => {
  it('renders the board with 9 squares and initial status', () => {
    let testRenderer!: renderer.ReactTestRenderer;
    act(() => {
      testRenderer = renderer.create(<Game />);
    });

    const texts = testRenderer.root.findAllByType(Text as any);
    const statusText = texts.find((t) => t.props.children === 'Next player: X');
    expect(statusText).toBeDefined();

    for (let i = 0; i < 9; i++) {
      const square = testRenderer.root.findByProps({ testID: `square-${i}` });
      expect(square).toBeDefined();
    }
  });

  it('allows players to take turns and updates status', () => {
    let testRenderer!: renderer.ReactTestRenderer;
    act(() => {
      testRenderer = renderer.create(<Game />);
    });

    // Player X clicks square 0
    act(() => {
      testRenderer.root.findByProps({ testID: 'square-0' }).props.onPress();
    });

    let texts = testRenderer.root.findAllByType(Text as any);
    expect(texts.some((t) => t.props.children === 'Next player: O')).toBe(true);

    // Player O clicks square 1
    act(() => {
      testRenderer.root.findByProps({ testID: 'square-1' }).props.onPress();
    });

    texts = testRenderer.root.findAllByType(Text as any);
    expect(texts.some((t) => t.props.children === 'Next player: X')).toBe(true);
  });

  it('detects a winner correctly', () => {
    let testRenderer!: renderer.ReactTestRenderer;
    act(() => {
      testRenderer = renderer.create(<Game />);
    });

    // X: 0, O: 3, X: 1, O: 4, X: 2 => X wins across top row
    act(() => { testRenderer.root.findByProps({ testID: 'square-0' }).props.onPress(); }); // X at 0
    act(() => { testRenderer.root.findByProps({ testID: 'square-3' }).props.onPress(); }); // O at 3
    act(() => { testRenderer.root.findByProps({ testID: 'square-1' }).props.onPress(); }); // X at 1
    act(() => { testRenderer.root.findByProps({ testID: 'square-4' }).props.onPress(); }); // O at 4
    act(() => { testRenderer.root.findByProps({ testID: 'square-2' }).props.onPress(); }); // X at 2

    const texts = testRenderer.root.findAllByType(Text as any);
    expect(texts.some((t) => t.props.children === 'Winner: X')).toBe(true);
  });

  it('detects a draw correctly', () => {
    let testRenderer!: renderer.ReactTestRenderer;
    act(() => {
      testRenderer = renderer.create(<Game />);
    });

    // Moves for draw:
    // X: 0, O: 1, X: 2
    // X: 4, O: 3, X: 5
    // O: 6, X: 7, O: 8 (wait let's check)
    // Board:
    // X O X
    // O X X
    // O X O
    // 0:X, 1:O, 2:X, 3:O, 4:X, 5:X, 6:O, 7:X, 8:O
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const pos of moves) {
      act(() => {
        testRenderer.root.findByProps({ testID: `square-${pos}` }).props.onPress();
      });
    }

    const texts = testRenderer.root.findAllByType(Text as any);
    expect(texts.some((t) => t.props.children === 'Draw')).toBe(true);
  });
});
