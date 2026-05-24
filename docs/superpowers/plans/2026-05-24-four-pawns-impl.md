# Four Pawns Chess Puzzle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive "Four Pawns" chess puzzle as a React + Vite web app where the player moves white pieces to create space for the knight to capture all 4 black pawns.

**Architecture:** Custom 4×6 chess engine (no chess.js — non-standard board) with `useReducer` for state. Board and piece rendering are pure React components using Lichess cburnett SVG pieces. All game logic lives in `src/game/` and is fully unit-tested with Vitest.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, Lichess cburnett SVG pieces (CC BY-SA 3.0)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/game/types.ts` | All shared TypeScript types (`Cell`, `Board`, `GameState`, `Action`, `PieceType`) |
| `src/game/initialState.ts` | `INITIAL_BOARD` constant and `initialGameState` factory |
| `src/game/legalMoves.ts` | Pure functions: `getLegalMoves`, per-piece helpers |
| `src/game/reducer.ts` | `gameReducer` function + `applyMove` helper |
| `src/game/__tests__/legalMoves.test.ts` | Unit tests for move engine |
| `src/game/__tests__/reducer.test.ts` | Unit tests for reducer |
| `src/components/Piece.tsx` | Renders one SVG piece by type |
| `src/components/Square.tsx` | One board square — handles clicks, highlights, move indicators |
| `src/components/Board.tsx` | 4×6 CSS grid of Square components |
| `src/components/SidePanel.tsx` | Move counter + Undo + Reset buttons |
| `src/components/WinScreen.tsx` | Full-screen win overlay |
| `src/App.tsx` | Root: wires useReducer → Board + SidePanel + WinScreen |
| `src/index.css` | Global dark theme, board colors, animations |
| `src/pieces/*.svg` | cburnett SVG assets (wN, wR, wB, wP, bP) |

---

## Task 1: Scaffold the Project

**Files:**
- Create: `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React + TypeScript**

Run in `C:\Users\gordo\source\repos\ChessPuzzle4Pawns`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted about non-empty directory, choose to ignore/continue.

- [ ] **Step 2: Install dependencies + add Vitest**

```bash
npm install
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vitest in vite.config.ts**

Replace the contents of `vite.config.ts` with:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Clear default boilerplate**

Delete: `src/assets/`, `src/App.css`

Replace `src/App.tsx` with a temporary placeholder:
```tsx
export default function App() {
  return <div>Four Pawns</div>
}
```

Replace `src/index.css` with empty file (we'll fill it in Task 13).

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts on `http://localhost:5173`, browser shows "Four Pawns".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite + TypeScript project with Vitest"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/game/types.ts`

- [ ] **Step 1: Create the types file**

Create `src/game/types.ts`:
```ts
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
  | { type: 'UNDO' }
  | { type: 'RESET' };
```

- [ ] **Step 2: Commit**

```bash
git add src/game/types.ts
git commit -m "feat: add game TypeScript types"
```

---

## Task 3: Initial Board State

**Files:**
- Create: `src/game/initialState.ts`

- [ ] **Step 1: Create the initial state file**

Create `src/game/initialState.ts`:
```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/game/initialState.ts
git commit -m "feat: add initial board state"
```

---

## Task 4: Legal Moves Engine (TDD)

**Files:**
- Create: `src/game/legalMoves.ts`
- Create: `src/game/__tests__/legalMoves.test.ts`

- [ ] **Step 1: Create the test helper and first failing tests**

Create `src/game/__tests__/legalMoves.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```
Expected: all tests fail with "Cannot find module '../legalMoves'"

- [ ] **Step 3: Implement legalMoves.ts**

Create `src/game/legalMoves.ts`:
```ts
import type { Board, Position } from './types';

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 6 && col >= 0 && col < 4;
}

function canLandOn(board: Board, row: number, col: number): boolean {
  if (!inBounds(row, col)) return false;
  const cell = board[row][col];
  if (cell.wall) return false;
  if (cell.piece?.startsWith('w')) return false;
  return true;
}

function getKnightMoves(board: Board, row: number, col: number): Position[] {
  const offsets: [number, number][] = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  return offsets
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row: r, col: c }) => canLandOn(board, r, c));
}

function getSlidingMoves(
  board: Board,
  row: number,
  col: number,
  directions: [number, number][]
): Position[] {
  const moves: Position[] = [];
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const cell = board[r][c];
      if (cell.wall) break;
      if (cell.piece?.startsWith('w')) break;
      moves.push({ row: r, col: c });
      if (cell.piece) break; // enemy piece: include square, then stop
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function getRookMoves(board: Board, row: number, col: number): Position[] {
  return getSlidingMoves(board, row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

function getBishopMoves(board: Board, row: number, col: number): Position[] {
  return getSlidingMoves(board, row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getPawnMoves(board: Board, row: number, col: number): Position[] {
  const moves: Position[] = [];
  const fwdRow = row - 1;

  if (inBounds(fwdRow, col)) {
    const fwd = board[fwdRow][col];
    if (!fwd.wall && !fwd.piece) {
      moves.push({ row: fwdRow, col });
    }
  }

  for (const dc of [-1, 1]) {
    const r = row - 1;
    const c = col + dc;
    if (inBounds(r, c)) {
      const cell = board[r][c];
      if (!cell.wall && cell.piece === 'bP') {
        moves.push({ row: r, col: c });
      }
    }
  }

  return moves;
}

export function getLegalMoves(board: Board, row: number, col: number): Position[] {
  const piece = board[row][col].piece;
  if (!piece) return [];
  switch (piece) {
    case 'wN': return getKnightMoves(board, row, col);
    case 'wR': return getRookMoves(board, row, col);
    case 'wB': return getBishopMoves(board, row, col);
    case 'wP': return getPawnMoves(board, row, col);
    default: return [];
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```
Expected: all 14 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/game/legalMoves.ts src/game/__tests__/legalMoves.test.ts
git commit -m "feat: add legal moves engine with full test coverage"
```

---

## Task 5: Game Reducer (TDD)

**Files:**
- Create: `src/game/reducer.ts`
- Create: `src/game/__tests__/reducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/game/__tests__/reducer.test.ts`:
```ts
import { describe, test, expect } from 'vitest';
import { gameReducer } from '../reducer';
import { makeInitialGameState } from '../initialState';
import type { GameState } from '../types';

function stateAfter(state: GameState, ...actions: Parameters<typeof gameReducer>[1][]): GameState {
  return actions.reduce((s, a) => gameReducer(s, a), state);
}

describe('SELECT action', () => {
  test('selecting a white piece computes legal moves', () => {
    // Move rook at (3,0) to (3,3) first so knight has a move... 
    // Actually just test that selecting a rook in a clear position works.
    // Rook at (3,0) can slide right if (3,1)(3,2)(3,3) are not own pieces.
    // In initial state all of row 3 has rooks so no horizontal moves.
    // Rook at (3,0) can slide down to (4,0) and (5,x)—but (5,0) is wall.
    // (4,0) has wP. So rook at (3,0) also blocked downward. 
    // Check that selecting sets selected correctly.
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
    // Move rook from (3,0) — we need it to have a legal move.
    // Set up state where rook at (3,0) can move to (4,3) (empty in initial state).
    // Actually from (3,0): can it go to (4,0)? (4,0) has wP. No.
    // Can it go to (3,1)? (3,1) has wR. No.
    // Let's use a hand-crafted state with a rook that has a clear path.
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
    // Build a state with only one bP remaining and a knight adjacent
    const state = makeInitialGameState();
    // Manually craft a near-win board
    const winBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    // Clear all black pawns except one
    winBoard[0][0].piece = null;
    winBoard[0][1].piece = null;
    winBoard[0][2].piece = null;
    // Keep bP at (0,3)
    // Place knight at (2,2) so it can jump to (0,3)
    winBoard[2][3].piece = null; // clear bishop
    winBoard[2][2].piece = null; // clear bishop
    winBoard[5][3].piece = null; // remove knight from start
    winBoard[2][2].piece = 'wN';

    const nearWin: GameState = {
      ...state,
      board: winBoard,
    };

    const selected = gameReducer(nearWin, { type: 'SELECT', row: 2, col: 2 });
    // Knight at (2,2): (-2,+1) = (0,3) — bP there, should be a legal move
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
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```
Expected: tests fail with "Cannot find module '../reducer'"

- [ ] **Step 3: Implement reducer.ts**

Create `src/game/reducer.ts`:
```ts
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

    case 'RESET':
      return makeInitialGameState();
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/reducer.ts src/game/__tests__/reducer.test.ts
git commit -m "feat: add game reducer with full test coverage"
```

---

## Task 6: Download SVG Piece Assets

**Files:**
- Create: `src/pieces/wN.svg`, `wR.svg`, `wB.svg`, `wP.svg`, `bP.svg`

- [ ] **Step 1: Create pieces directory and download cburnett SVGs**

Run from the project root:
```bash
mkdir -p src/pieces
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wN.svg" -o src/pieces/wN.svg
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wR.svg" -o src/pieces/wR.svg
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wB.svg" -o src/pieces/wB.svg
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/wP.svg" -o src/pieces/wP.svg
curl -L "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/bP.svg" -o src/pieces/bP.svg
```

- [ ] **Step 2: Verify all 5 files exist and are non-empty**

```bash
ls -la src/pieces/
```
Expected: 5 `.svg` files, each > 1KB.

- [ ] **Step 3: Add Vite SVG type declaration**

Create `src/vite-env.d.ts` (or add to existing one):
```ts
/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pieces/ src/vite-env.d.ts
git commit -m "feat: add cburnett SVG chess piece assets"
```

---

## Task 7: Piece Component

**Files:**
- Create: `src/components/Piece.tsx`

- [ ] **Step 1: Create the Piece component**

Create `src/components/Piece.tsx`:
```tsx
import type { PieceType } from '../game/types';
import wNSrc from '../pieces/wN.svg';
import wRSrc from '../pieces/wR.svg';
import wBSrc from '../pieces/wB.svg';
import wPSrc from '../pieces/wP.svg';
import bPSrc from '../pieces/bP.svg';

const PIECE_SRC: Record<PieceType, string> = {
  wN: wNSrc,
  wR: wRSrc,
  wB: wBSrc,
  wP: wPSrc,
  bP: bPSrc,
};

type PieceProps = {
  type: PieceType;
};

export function Piece({ type }: PieceProps) {
  return (
    <img
      src={PIECE_SRC[type]}
      alt={type}
      className="piece"
      draggable={false}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Piece.tsx
git commit -m "feat: add Piece SVG component"
```

---

## Task 8: Square Component

**Files:**
- Create: `src/components/Square.tsx`

- [ ] **Step 1: Create the Square component**

Create `src/components/Square.tsx`:
```tsx
import type { Action, Cell, Position } from '../game/types';
import type { Dispatch } from 'react';
import { Piece } from './Piece';

type SquareProps = {
  cell: Cell;
  row: number;
  col: number;
  isSelected: boolean;
  isLegalMove: boolean;
  dispatch: Dispatch<Action>;
};

export function Square({ cell, row, col, isSelected, isLegalMove, dispatch }: SquareProps) {
  const isLight = (row + col) % 2 === 0;

  let squareClass = 'square';
  if (cell.wall) {
    squareClass += ' square--wall';
  } else {
    squareClass += isLight ? ' square--light' : ' square--dark';
  }
  if (isSelected) squareClass += ' square--selected';

  const handleClick = () => {
    if (isLegalMove) {
      dispatch({ type: 'MOVE', row, col });
    } else {
      dispatch({ type: 'SELECT', row, col });
    }
  };

  const isCapture = isLegalMove && cell.piece === 'bP';

  return (
    <div className={squareClass} onClick={handleClick}>
      {cell.piece && <Piece type={cell.piece} />}
      {isLegalMove && !isCapture && <div className="move-dot" />}
      {isLegalMove && isCapture && <div className="move-ring" />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Square.tsx
git commit -m "feat: add Square component with click handling and move indicators"
```

---

## Task 9: Board Component

**Files:**
- Create: `src/components/Board.tsx`

- [ ] **Step 1: Create the Board component**

Create `src/components/Board.tsx`:
```tsx
import type { Dispatch } from 'react';
import type { Action, GameState } from '../game/types';
import { Square } from './Square';

type BoardProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
};

export function Board({ state, dispatch }: BoardProps) {
  return (
    <div className="board">
      {state.board.map((row, r) =>
        row.map((cell, c) => (
          <Square
            key={`${r}-${c}`}
            cell={cell}
            row={r}
            col={c}
            isSelected={state.selected?.row === r && state.selected?.col === c}
            isLegalMove={state.legalMoves.some(m => m.row === r && m.col === c)}
            dispatch={dispatch}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat: add Board component"
```

---

## Task 10: SidePanel Component

**Files:**
- Create: `src/components/SidePanel.tsx`

- [ ] **Step 1: Create the SidePanel component**

Create `src/components/SidePanel.tsx`:
```tsx
import type { Dispatch } from 'react';
import type { Action, GameState } from '../game/types';

type SidePanelProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
};

export function SidePanel({ state, dispatch }: SidePanelProps) {
  const canUndo = state.history.length > 0;

  return (
    <div className="side-panel">
      <div className="move-counter">
        <span className="move-counter__label">MOVES</span>
        <span className="move-counter__value">{state.moveCount}</span>
      </div>
      <button
        className="btn btn--undo"
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo}
      >
        ↩ Undo
      </button>
      <button
        className="btn btn--reset"
        onClick={() => dispatch({ type: 'RESET' })}
      >
        ↺ Reset
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SidePanel.tsx
git commit -m "feat: add SidePanel with move counter, undo, and reset"
```

---

## Task 11: WinScreen Component

**Files:**
- Create: `src/components/WinScreen.tsx`

- [ ] **Step 1: Create the WinScreen component**

Create `src/components/WinScreen.tsx`:
```tsx
type WinScreenProps = {
  moveCount: number;
  onReset: () => void;
};

export function WinScreen({ moveCount, onReset }: WinScreenProps) {
  return (
    <div className="win-overlay">
      <div className="win-card">
        <div className="win-icon">♞</div>
        <h2 className="win-title">Puzzle Solved!</h2>
        <p className="win-moves">
          Completed in <strong>{moveCount}</strong> {moveCount === 1 ? 'move' : 'moves'}
        </p>
        <button className="btn btn--play-again" onClick={onReset}>
          Play Again
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WinScreen.tsx
git commit -m "feat: add WinScreen overlay component"
```

---

## Task 12: App Assembly + Global Styles

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Wire up App.tsx**

Replace `src/App.tsx` with:
```tsx
import { useReducer } from 'react';
import { gameReducer } from './game/reducer';
import { makeInitialGameState } from './game/initialState';
import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { WinScreen } from './components/WinScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialGameState);

  return (
    <div className="app">
      <div className="game-container">
        <header className="game-header">
          <h1 className="game-title">Four Pawns</h1>
          <p className="game-subtitle">A chess puzzle</p>
        </header>
        <div className="game-body">
          <Board state={state} dispatch={dispatch} />
          <SidePanel state={state} dispatch={dispatch} />
        </div>
      </div>
      {state.won && (
        <WinScreen
          moveCount={state.moveCount}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write global CSS**

Replace `src/index.css` with:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --sq-size: 80px;
  --board-cols: 4;
  --board-rows: 6;
  --color-light: #ede6f8;
  --color-dark: #9775c8;
  --color-wall: #111111;
  --color-selected: rgba(255, 220, 50, 0.5);
  --color-bg: #0f0f1a;
  --color-panel-bg: #1a1a2e;
  --color-panel-border: #2d2d4a;
  --color-accent: #c0aee0;
  --color-text-muted: #7a6a9a;
  --color-btn-text: #c8b8e8;
}

body {
  background: var(--color-bg);
  color: #e8e0f8;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* App layout */
.app {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* Header */
.game-header {
  text-align: center;
}

.game-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #e8dff8;
  text-transform: uppercase;
}

.game-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  margin-top: 4px;
}

/* Game body: board + side panel */
.game-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Board */
.board {
  display: grid;
  grid-template-columns: repeat(var(--board-cols), var(--sq-size));
  grid-template-rows: repeat(var(--board-rows), var(--sq-size));
  border: 2px solid #2d2d4a;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

/* Squares */
.square {
  width: var(--sq-size);
  height: var(--sq-size);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: filter 0.1s ease;
}

.square--light { background: var(--color-light); }
.square--dark  { background: var(--color-dark); }
.square--wall  { background: var(--color-wall); cursor: default; }

.square--selected {
  background: var(--color-selected) !important;
  filter: brightness(1.1);
}

.square--selected.square--light { background: color-mix(in srgb, var(--color-light) 60%, #ffdc32 40%) !important; }
.square--selected.square--dark  { background: color-mix(in srgb, var(--color-dark) 60%, #ffdc32 40%) !important; }

.square:not(.square--wall):hover {
  filter: brightness(1.08);
}

/* Pieces */
.piece {
  width: 85%;
  height: 85%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

/* Move indicators */
.move-dot {
  position: absolute;
  width: 30px;
  height: 30px;
  background: rgba(20, 220, 100, 0.55);
  border-radius: 50%;
  pointer-events: none;
}

.move-ring {
  position: absolute;
  width: calc(var(--sq-size) - 8px);
  height: calc(var(--sq-size) - 8px);
  border: 5px solid rgba(20, 220, 100, 0.65);
  border-radius: 50%;
  pointer-events: none;
}

/* Side panel */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 100px;
}

.move-counter {
  background: var(--color-panel-bg);
  border: 1px solid var(--color-panel-border);
  border-radius: 10px;
  padding: 14px 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.move-counter__label {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.move-counter__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

/* Buttons */
.btn {
  background: var(--color-panel-bg);
  border: 1px solid var(--color-panel-border);
  border-radius: 10px;
  padding: 12px 18px;
  font-size: 0.9rem;
  color: var(--color-btn-text);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  text-align: center;
  width: 100%;
  letter-spacing: 0.03em;
}

.btn:hover:not(:disabled) {
  background: #252540;
  border-color: var(--color-accent);
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Win screen */
.win-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.win-card {
  background: #1a1a2e;
  border: 1px solid #3a3a6a;
  border-radius: 16px;
  padding: 48px 56px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
  animation: fadeScaleIn 0.3s ease-out;
}

@keyframes fadeScaleIn {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}

.win-icon {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 16px;
}

.win-title {
  font-family: Georgia, serif;
  font-size: 1.8rem;
  color: #e8dff8;
  margin-bottom: 12px;
}

.win-moves {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 28px;
}

.win-moves strong {
  color: var(--color-accent);
  font-size: 1.2rem;
}

.btn--play-again {
  background: #2d2060;
  border-color: var(--color-accent);
  font-size: 1rem;
  padding: 14px 32px;
}

.btn--play-again:hover {
  background: #3a2a80;
}
```

- [ ] **Step 3: Verify the app looks correct in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- "FOUR PAWNS" title centered above the board
- 4×6 board visible with correct piece placement
- WALL squares are solid black (rows 1 and bottom-left 3)
- White pieces (wN, wR, wB, wP) visible with SVG rendering
- Black pawns (bP) visible in top row
- Side panel shows MOVES: 0, Undo (disabled), Reset

- [ ] **Step 4: Test interactions manually**

1. Click a white rook — legal move dots appear on reachable squares
2. Click a dot — rook moves, move counter increments to 1
3. Click Undo — rook returns, counter back to 0
4. Click Reset — board returns to initial state

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: wire up app with full game UI and styling"
```

---

## Task 13: End-to-End Smoke Test + Final Commit

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 2: Build for production**

```bash
npm run build
```
Expected: build succeeds with no errors in `dist/`.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```
Open the preview URL and verify the game works identically to dev mode.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Four Pawns puzzle app"
```

---

## Self-Review Checklist

- [x] Board 4×6, correct piece placement — Task 3
- [x] WALL squares block all pieces, knight can jump over — Tasks 4, 5
- [x] Knight, rook, bishop, pawn move rules — Task 4
- [x] Click to select + legal move indicators — Tasks 8, 9
- [x] Click dot to move — Task 8
- [x] Move counter increments — Task 5, 10
- [x] Undo restores previous board — Task 5, 10
- [x] Undo disabled when history empty — Task 10
- [x] Reset restores initial state — Task 5, 10
- [x] Win screen on capturing all 4 black pawns — Tasks 5, 11
- [x] cburnett SVG pieces — Task 6, 7
- [x] Purple board theme, dark background — Task 12
- [x] Title "Four Pawns" above board — Task 12
- [x] Win screen fade+scale animation — Task 12
