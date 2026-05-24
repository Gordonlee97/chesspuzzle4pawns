import { describe, test, expect } from 'vitest';
import { getLegalMoves } from '../legalMoves';
import type { Board, Cell, PieceType } from '../types';
import { INITIAL_BOARD } from '../initialState';

// Builds a clean board with only the wall positions and specified pieces.
function makeBoard(pieces: { row: number; col: number; piece: PieceType }[]): Board {
  const board: Board = Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 4 }, (_, c) => ({
      piece: null,
      wall: r === 1 || (r === 5 && c < 3),
    } as Cell))
  );
  for (const { row, col, piece } of pieces) {
    board[row][col].piece = piece;
  }
  return board;
}

describe('knight moves', () => {
  test('knight has no legal moves from starting position', () => {
    const moves = getLegalMoves(INITIAL_BOARD, 5, 3);
    expect(moves).toHaveLength(0);
  });

  test('knight can jump over wall row to reach row 0', () => {
    const board = makeBoard([{ row: 2, col: 0, piece: 'wN' }]);
    const moves = getLegalMoves(board, 2, 0);
    expect(moves).toContainEqual({ row: 0, col: 1 });
  });

  test('knight cannot land on wall squares', () => {
    const board = makeBoard([{ row: 3, col: 1, piece: 'wN' }]);
    const moves = getLegalMoves(board, 3, 1);
    for (const m of moves) {
      const cell = board[m.row][m.col];
      expect(cell.wall).toBe(false);
    }
  });

  test('knight can capture a black pawn', () => {
    const board = makeBoard([
      { row: 2, col: 0, piece: 'wN' },
      { row: 0, col: 1, piece: 'bP' },
    ]);
    const moves = getLegalMoves(board, 2, 0);
    expect(moves).toContainEqual({ row: 0, col: 1 });
  });

  test('knight cannot land on own piece', () => {
    const board = makeBoard([
      { row: 3, col: 2, piece: 'wN' },
      { row: 2, col: 0, piece: 'wR' },
    ]);
    const moves = getLegalMoves(board, 3, 2);
    expect(moves).not.toContainEqual({ row: 2, col: 0 });
  });
});

describe('rook moves', () => {
  test('rook slides horizontally until blocked by own piece', () => {
    const board = makeBoard([
      { row: 3, col: 0, piece: 'wR' },
      { row: 3, col: 3, piece: 'wR' },
    ]);
    const moves = getLegalMoves(board, 3, 0);
    expect(moves).toContainEqual({ row: 3, col: 1 });
    expect(moves).toContainEqual({ row: 3, col: 2 });
    expect(moves).not.toContainEqual({ row: 3, col: 3 });
  });

  test('rook slides vertically and stops at wall', () => {
    const board = makeBoard([{ row: 2, col: 0, piece: 'wR' }]);
    const moves = getLegalMoves(board, 2, 0);
    expect(moves).not.toContainEqual({ row: 1, col: 0 });
    expect(moves).not.toContainEqual({ row: 0, col: 0 });
  });

  test('rook can capture black pawn and stops there', () => {
    const board = makeBoard([
      { row: 3, col: 0, piece: 'wR' },
      { row: 3, col: 2, piece: 'bP' },
    ]);
    const moves = getLegalMoves(board, 3, 0);
    expect(moves).toContainEqual({ row: 3, col: 1 });
    expect(moves).toContainEqual({ row: 3, col: 2 });
    expect(moves).not.toContainEqual({ row: 3, col: 3 });
  });
});

describe('bishop moves', () => {
  test('bishop slides diagonally until edge of board', () => {
    const board = makeBoard([{ row: 3, col: 0, piece: 'wB' }]);
    const moves = getLegalMoves(board, 3, 0);
    expect(moves).toContainEqual({ row: 4, col: 1 });
    expect(moves).toContainEqual({ row: 2, col: 1 });
  });

  test('bishop cannot pass through wall diagonally', () => {
    const board = makeBoard([{ row: 2, col: 1, piece: 'wB' }]);
    const moves = getLegalMoves(board, 2, 1);
    // Diagonal up-left: (1,0) is wall — blocked
    expect(moves).not.toContainEqual({ row: 1, col: 0 });
    expect(moves).not.toContainEqual({ row: 0, col: -1 });
  });

  test('bishop blocked by own piece', () => {
    const board = makeBoard([
      { row: 3, col: 0, piece: 'wB' },
      { row: 2, col: 1, piece: 'wR' },
    ]);
    const moves = getLegalMoves(board, 3, 0);
    expect(moves).not.toContainEqual({ row: 2, col: 1 });
  });
});

describe('pawn moves', () => {
  test('pawn moves one square forward (toward row 0)', () => {
    const board = makeBoard([{ row: 4, col: 0, piece: 'wP' }]);
    const moves = getLegalMoves(board, 4, 0);
    expect(moves).toContainEqual({ row: 3, col: 0 });
  });

  test('pawn cannot move into wall', () => {
    const board = makeBoard([{ row: 2, col: 0, piece: 'wP' }]);
    const moves = getLegalMoves(board, 2, 0);
    expect(moves).not.toContainEqual({ row: 1, col: 0 });
  });

  test('pawn cannot move forward if blocked by a piece', () => {
    const board = makeBoard([
      { row: 4, col: 0, piece: 'wP' },
      { row: 3, col: 0, piece: 'wR' },
    ]);
    const moves = getLegalMoves(board, 4, 0);
    expect(moves).not.toContainEqual({ row: 3, col: 0 });
  });

  test('pawn captures diagonally forward', () => {
    const board = makeBoard([
      { row: 4, col: 1, piece: 'wP' },
      { row: 3, col: 0, piece: 'bP' },
      { row: 3, col: 2, piece: 'bP' },
    ]);
    const moves = getLegalMoves(board, 4, 1);
    expect(moves).toContainEqual({ row: 3, col: 0 });
    expect(moves).toContainEqual({ row: 3, col: 2 });
  });

  test('pawn does not capture own piece diagonally', () => {
    const board = makeBoard([
      { row: 4, col: 1, piece: 'wP' },
      { row: 3, col: 0, piece: 'wR' },
    ]);
    const moves = getLegalMoves(board, 4, 1);
    expect(moves).not.toContainEqual({ row: 3, col: 0 });
  });
});
