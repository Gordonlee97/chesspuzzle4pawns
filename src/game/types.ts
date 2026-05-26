export type PieceType = 'wN' | 'wR' | 'wB' | 'wP' | 'bP';

export type Cell = {
  piece: PieceType | null;
  wall: boolean;
};

export type Board = Cell[][];

export type Position = { row: number; col: number };

export type GameState = {
  board: Board;
  selected: Position | null;
  legalMoves: Position[];
  history: Board[];
  moveCount: number;
  won: boolean;
};

export type Action =
  | { type: 'SELECT'; row: number; col: number }
  | { type: 'MOVE'; row: number; col: number }
  | { type: 'DESELECT' }
  | { type: 'UNDO' }
  | { type: 'RESET' };
