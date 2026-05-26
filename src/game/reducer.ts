import type { Action, Board, GameState } from './types';
import { getLegalMoves } from './legalMoves';
import { makeInitialGameState } from './initialState';

function applyMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): Board {
  const next = board.map(row => row.map(cell => ({ ...cell })));
  next[toRow][toCol].piece = next[fromRow][fromCol].piece;
  next[fromRow][fromCol].piece = null;
  return next;
}

function hasWon(board: Board): boolean {
  return !board.some(row => row.some(cell => cell.piece === 'bP'));
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT': {
      const { row, col } = action;
      if (state.selected?.row === row && state.selected?.col === col) {
        return { ...state, selected: null, legalMoves: [] };
      }
      const cell = state.board[row][col];
      if (cell.piece?.startsWith('w')) {
        return {
          ...state,
          selected: { row, col },
          legalMoves: getLegalMoves(state.board, row, col),
        };
      }
      return { ...state, selected: null, legalMoves: [] };
    }

    case 'MOVE': {
      if (!state.selected) return state;
      const { row: fromRow, col: fromCol } = state.selected;
      const { row: toRow, col: toCol } = action;
      const newBoard = applyMove(state.board, fromRow, fromCol, toRow, toCol);
      return {
        ...state,
        board: newBoard,
        selected: null,
        legalMoves: [],
        history: [...state.history, state.board],
        moveCount: state.moveCount + 1,
        won: hasWon(newBoard),
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        board: previous.map(row => row.map(cell => ({ ...cell }))),
        history: state.history.slice(0, -1),
        moveCount: state.moveCount - 1,
        selected: null,
        legalMoves: [],
        won: false,
      };
    }

    case 'DESELECT':
      return { ...state, selected: null, legalMoves: [] };

    case 'RESET':
      return makeInitialGameState();
  }
}
