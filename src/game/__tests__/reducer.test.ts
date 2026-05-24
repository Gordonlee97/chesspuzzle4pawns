import { describe, test, expect } from 'vitest';
import { gameReducer } from '../reducer';
import { makeInitialGameState } from '../initialState';
import type { GameState } from '../types';

function stateAfter(state: GameState, ...actions: Parameters<typeof gameReducer>[1][]): GameState {
  return actions.reduce((s, a) => gameReducer(s, a), state);
}

describe('SELECT action', () => {
  test('selecting a white piece computes legal moves', () => {
    const state = makeInitialGameState();
    const next = gameReducer(state, { type: 'SELECT', row: 3, col: 0 });
    expect(next.selected).toEqual({ row: 3, col: 0 });
    expect(next.legalMoves).toBeDefined();
  });

  test('selecting a non-white-piece square deselects', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 0 });
    const deselected = gameReducer(selected, { type: 'SELECT', row: 0, col: 0 });
    expect(deselected.selected).toBeNull();
    expect(deselected.legalMoves).toHaveLength(0);
  });
});

describe('MOVE action', () => {
  test('moving a piece updates the board', () => {
    const state = makeInitialGameState();
    // Rook at (3,3): can slide to (4,3) which is empty
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    expect(selected.legalMoves).toContainEqual({ row: 4, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    expect(moved.board[4][3].piece).toBe('wR');
    expect(moved.board[3][3].piece).toBeNull();
  });

  test('moving increments move count', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    expect(moved.moveCount).toBe(1);
  });

  test('moving pushes board to history', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    expect(moved.history).toHaveLength(1);
  });

  test('moving clears selection and legalMoves', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    expect(moved.selected).toBeNull();
    expect(moved.legalMoves).toHaveLength(0);
  });

  test('capturing last black pawn sets won to true', () => {
    const state = makeInitialGameState();
    const winBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    // Clear all black pawns except one at (0,3)
    winBoard[0][0].piece = null;
    winBoard[0][1].piece = null;
    winBoard[0][2].piece = null;
    // Place knight at (2,2): it can jump to (0,3) via (-2,+1)
    winBoard[2][3].piece = null;
    winBoard[2][2].piece = null;
    winBoard[5][3].piece = null;
    winBoard[2][2].piece = 'wN';

    const nearWin: GameState = { ...state, board: winBoard };
    const selected = gameReducer(nearWin, { type: 'SELECT', row: 2, col: 2 });
    const legalCapture = selected.legalMoves.find(m => m.row === 0 && m.col === 3);
    expect(legalCapture).toBeDefined();

    const won = gameReducer(selected, { type: 'MOVE', row: 0, col: 3 });
    expect(won.won).toBe(true);
  });
});

describe('UNDO action', () => {
  test('undo restores previous board state', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    const undone = gameReducer(moved, { type: 'UNDO' });
    expect(undone.board[3][3].piece).toBe('wR');
    expect(undone.board[4][3].piece).toBeNull();
  });

  test('undo decrements move count', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    const undone = gameReducer(moved, { type: 'UNDO' });
    expect(undone.moveCount).toBe(0);
  });

  test('undo clears won flag', () => {
    const state = makeInitialGameState();
    const winBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    winBoard[0][0].piece = null;
    winBoard[0][1].piece = null;
    winBoard[0][2].piece = null;
    winBoard[2][3].piece = null;
    winBoard[2][2].piece = null;
    winBoard[5][3].piece = null;
    winBoard[2][2].piece = 'wN';
    const nearWin: GameState = { ...state, board: winBoard };
    const selected = gameReducer(nearWin, { type: 'SELECT', row: 2, col: 2 });
    const won = gameReducer(selected, { type: 'MOVE', row: 0, col: 3 });
    expect(won.won).toBe(true);
    const undone = gameReducer(won, { type: 'UNDO' });
    expect(undone.won).toBe(false);
  });

  test('undo with empty history is a no-op', () => {
    const state = makeInitialGameState();
    const unchanged = gameReducer(state, { type: 'UNDO' });
    expect(unchanged.moveCount).toBe(0);
    expect(unchanged.history).toHaveLength(0);
  });
});

describe('RESET action', () => {
  test('reset restores initial board', () => {
    const state = makeInitialGameState();
    const selected = gameReducer(state, { type: 'SELECT', row: 3, col: 3 });
    const moved = gameReducer(selected, { type: 'MOVE', row: 4, col: 3 });
    const reset = gameReducer(moved, { type: 'RESET' });
    expect(reset.board[3][3].piece).toBe('wR');
    expect(reset.board[4][3].piece).toBeNull();
    expect(reset.moveCount).toBe(0);
    expect(reset.history).toHaveLength(0);
    expect(reset.won).toBe(false);
  });
});
