import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface SquareProps {
  value: string | null;
  onSquareClick: () => void;
  index: number;
}

function Square({ value, onSquareClick, index }: SquareProps) {
  return (
    <Pressable
      testID={`square-${index}`}
      className="bg-accent flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-md sm:rounded-lg active:opacity-75 focus:outline-none"
      onPress={onSquareClick}
      accessibilityRole="button"
      accessibilityLabel={`Square ${index + 1}${value ? `, ${value}` : ', empty'}`}
    >
      <Text className="text-secondary text-3xl sm:text-4xl font-bold">{value}</Text>
    </Pressable>
  );
}

interface BoardProps {
  xIsNext: boolean;
  squares: (string | null)[];
  onPlay: (nextSquares: (string | null)[]) => void;
}

function Board({ xIsNext, squares, onPlay }: BoardProps) {
  function handleClick(i: number) {
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  let status: string;
  if (winner) {
    status = "Winner: " + winner;
  } else if (!squares.includes(null)) {
    status = "Draw";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  return (
    <View className="items-center">
      <Text className="detail-subheader mb-3 text-themed" style={{ textAlign: 'center' }}>
        {status}
      </Text>
      <View className="bg-secondary p-1.5 sm:p-2 rounded-xl flex flex-col gap-1.5 sm:gap-2 shadow-sm">
        <View className="flex flex-row gap-1.5 sm:gap-2">
          <Square value={squares[0]} onSquareClick={() => handleClick(0)} index={0} />
          <Square value={squares[1]} onSquareClick={() => handleClick(1)} index={1} />
          <Square value={squares[2]} onSquareClick={() => handleClick(2)} index={2} />
        </View>
        <View className="flex flex-row gap-1.5 sm:gap-2">
          <Square value={squares[3]} onSquareClick={() => handleClick(3)} index={3} />
          <Square value={squares[4]} onSquareClick={() => handleClick(4)} index={4} />
          <Square value={squares[5]} onSquareClick={() => handleClick(5)} index={5} />
        </View>
        <View className="flex flex-row gap-1.5 sm:gap-2">
          <Square value={squares[6]} onSquareClick={() => handleClick(6)} index={6} />
          <Square value={squares[7]} onSquareClick={() => handleClick(7)} index={7} />
          <Square value={squares[8]} onSquareClick={() => handleClick(8)} index={8} />
        </View>
      </View>
    </View>
  );
}

function calculateWinner(squares: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default function Game() {
  const [history, setHistory] = useState<(string | null)[][]>([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares: (string | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
    // Empty history after the move
    setHistory(history.slice(0, nextMove + 1));
  }

  const moves = history.map((squares, move) => {
    let description: string;
    if (currentMove === move) {
      if (move === 0) {
        return (
          <View key={move} className="my-1">
            <Text className="detail-body text-center font-semibold text-themed">Game start</Text>
          </View>
        );
      } else {
        return (
          <View key={move} className="my-1">
            <Text className="detail-body text-center font-semibold text-themed">Turn #{move}</Text>
          </View>
        );
      }
    } else if (move > 0) {
      description = 'Go to turn #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <View key={move} className="my-1">
        <Pressable
          className="bg-themed px-3 py-1.5 rounded active:opacity-70 shadow-sm"
          onPress={() => jumpTo(move)}
          accessibilityRole="button"
        >
          <Text className="text-themed text-center text-sm font-medium">{description}</Text>
        </Pressable>
      </View>
    );
  });

  return (
    <View className="flex flex-col items-center justify-center p-3 sm:p-4">
      <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      <View className="flex flex-col items-center mt-3">
        {moves}
      </View>
    </View>
  );
}
