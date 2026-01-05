import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface SquareProps {
  value: string | null;
  onSquareClick: () => void;
}

function Square({ value, onSquareClick }: SquareProps) {
  return (
    <View className="bg-accent flex justify-center items-center w-[9%] h-[9%] p-[1%] m-[0.5%] rounded-[0.5%]">
      <Pressable className="bg-accent flex justify-center items-center w-[9%] h-[9%] p-[1%] m-[0.5%] rounded-[0.5%]" onPress={onSquareClick}>
        <Text className="text-secondary text-[5.5%]">{value}</Text>
      </Pressable>
      {/* <Button 
        title={value || ''} 
        onPress={onSquareClick}
        color={value === 'X' ? 'blue' : (value === 'O' ? 'red' : 'black')}
        /> */}
    </View>
  );
}

interface BoardProps {
  xIsNext: boolean;
  squares: Array<string | null>;
  onPlay: (nextSquares: Array<string | null>) => void;
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
  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else if (!squares.includes(null)) {
    status = "Draw";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  return (
    <>
      <Text className="text-themed text-[2.2%] font-bold mb-[1%] text-center">{status}</Text>
      <View className="flex flex-col justify-center items-center p-[1%] rounded-[0.5%]">
        <View className="bg-secondary flex flex-row justify-center items-center">
          <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
          <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
          <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
        </View>
        <View className="bg-secondary flex flex-row justify-center items-center">
          <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
          <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
          <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
        </View>
        <View className="bg-secondary flex flex-row justify-center items-center">
          <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
          <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
          <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
        </View>
      </View>
    </>
  );
}

function calculateWinner(squares: Array<string | null>): string | null {
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
  const [history, setHistory] = useState<Array<Array<string | null>>>([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares: Array<string | null>) {
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
    let description;
    if (currentMove === move) {
      if (move === 0) {
        return (
          <View key={move}>
            <Text className="text-[2%]">Game start</Text>
          </View>
        )
      } else {
      return (
        <View>
          <Text className="text-[2%]">Turn #{move}</Text>
        </View>
      )
      }
    } else if (move > 0) {
      description = 'Go to turn #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <View key={move}>
        <Pressable className="bg-themed text-themed p-[0.2%] m-[0.5%] rounded-[0.2%] text-[2%]" onPress={() => jumpTo(move)}>
          <Text>{description}</Text>
        </Pressable>
        {/* <Button title={description} onPress={() => jumpTo(move)} /> */}
      </View>
    );
  });
  

  return (
    <View>
      <View>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </View>
      <View>
        {moves.map((move, index) => (
          <View className="items-center" key={index}>
            <Text>{move}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}