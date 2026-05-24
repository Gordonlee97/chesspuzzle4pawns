import type { Board, Cell, GameState } from './types';

const W = (piece: Cell['piece']): Cell => ({ piece, wall: false });
const WALL: Cell = { piece: null, wall: true };

export const INITIAL_BOARD: Board = [
  // Row 0 (top): 4 black pawns
  [W('bP'), W('bP'), W('bP'), W('bP')],
  // Row 1: full wall row
  [WALL, WALL, WALL, WALL],
  // Row 2: 4 white bishops
  [W('wB'), W('wB'), W('wB'), W('wB')],
  // Row 3: 4 white rooks
  [W('wR'), W('wR'), W('wR'), W('wR')],
  // Row 4: 3 white pawns, col 3 empty
  [W('wP'), W('wP'), W('wP'), W(null)],
  // Row 5 (bottom): cols 0-2 wall, col 3 has knight
  [WALL, WALL, WALL, W('wN')],
];

export function makeInitialGameState(): GameState {
  return {
    board: INITIAL_BOARD.map(row => row.map(cell => ({ ...cell }))),
    selected: null,
    legalMoves: [],
    history: [],
    moveCount: 0,
    won: false,
  };
}
