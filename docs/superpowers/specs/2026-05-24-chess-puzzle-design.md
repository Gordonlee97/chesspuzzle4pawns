# Four Pawns — Chess Puzzle App Design

**Date:** 2026-05-24  
**Stack:** React + Vite + SVG chess pieces (Lichess cburnett set)

---

## Overview

An interactive browser puzzle based on the physical "Four Pawns" chess puzzle. The player moves all white pieces using standard chess rules to create space for the white knight to navigate the board and capture all 4 black pawns. The app looks and feels like a real chess app: click a piece to see highlighted legal move dots, click a dot to move.

---

## Board

**Dimensions:** 4 columns × 6 rows (non-standard; custom engine required — no chess.js).

**Coordinate system:** `row` 0 = top (black pawn side), `row` 5 = bottom (knight side). `col` 0–3 left to right.

**Initial piece placement:**

| Row | Col 0 | Col 1 | Col 2 | Col 3 |
|-----|-------|-------|-------|-------|
| 0   | bP    | bP    | bP    | bP    |
| 1   | WALL  | WALL  | WALL  | WALL  |
| 2   | wB    | wB    | wB    | wB    |
| 3   | wR    | wR    | wR    | wR    |
| 4   | wP    | wP    | wP    | —     |
| 5   | WALL  | WALL  | WALL  | wN    |

**WALL squares:** Permanently illegal. No piece may land on or pass through them. The knight, which jumps, may jump over them but not land on them.

**Chessboard tiling:** `(row + col) % 2 === 0` → dark square (`#9775c8`), else light square (`#ede6f8`). WALL squares render as solid black (`#111`).

---

## Piece Rendering

Use the open-source **Lichess cburnett SVG piece set** (CC BY-SA 3.0). Individual SVG files per piece fetched at build time or bundled as React components. Pieces:

- `wN` — white knight
- `wR` — white rook  
- `wB` — white bishop
- `wP` — white pawn
- `bP` — black pawn

Each piece SVG is rendered inside its square, sized to ~85% of the square width, centered.

---

## Move Rules

All standard chess movement rules apply, with these constraints enforced by the custom engine:

**All pieces:**
- Cannot land on WALL squares
- Cannot land on squares occupied by other white pieces
- Sliding pieces (rook, bishop) are blocked by any occupied square or WALL — they cannot pass through

**White pawn (`wP`):**
- Moves one square toward row 0 (upward)
- Captures diagonally one square toward row 0
- No two-square initial move
- No en passant
- No promotion (pawns cannot reach row 0 — blocked by WALL at row 1)

**White rook (`wR`):**
- Slides horizontally or vertically any number of squares
- Blocked by pieces and WALL squares

**White bishop (`wB`):**
- Slides diagonally any number of squares
- Blocked by pieces and WALL squares

**White knight (`wN`):**
- Standard L-shaped jumps (±1,±2) and (±2,±1)
- Jumps over all pieces and WALL squares — only the landing square matters
- Cannot land on WALL squares or own pieces
- Can land on black pawn squares (captures them)

**Capture:** A white piece lands on a `bP` square — the black pawn is removed. No black pieces move.

**Win condition:** All 4 `bP` squares cleared.

---

## Game State

Managed with `useReducer` in the root `App` component:

```ts
type Cell = {
  piece: 'wN' | 'wR' | 'wB' | 'wP' | 'bP' | null;
  wall: boolean;
};

type Board = Cell[][];  // [6][4]

type GameState = {
  board: Board;
  selected: { row: number; col: number } | null;
  legalMoves: { row: number; col: number }[];
  history: Board[];      // stack of past board snapshots for undo
  moveCount: number;
  won: boolean;
};
```

**Actions:**
- `SELECT` — player clicks a white piece; compute and store legal moves
- `MOVE` — player clicks a legal move square; push current board to history, apply move, increment moveCount, check win
- `UNDO` — pop history stack, decrement moveCount, clear won flag
- `RESET` — restore initial board, clear history and counter

---

## UI Layout

```
┌──────────────────────────────────┐
│           FOUR PAWNS             │  ← title, centered, serif font
│         A chess puzzle           │
│                                  │
│  ┌──────────────┐  ┌──────────┐  │
│  │              │  │  MOVES   │  │
│  │    Board     │  │    0     │  │
│  │   4 × 6      │  │          │  │
│  │              │  │  ↩ Undo  │  │
│  │              │  │  ↺ Reset │  │
│  └──────────────┘  └──────────┘  │
└──────────────────────────────────┘
```

**Square size:** 80px × 80px (board = 320px × 480px).

**Selected piece highlight:** Subtle yellow/gold ring or background tint on the selected square.

**Legal move indicators:** Green semi-transparent circle overlaid on empty squares; green ring on capturable enemy squares (standard Lichess style).

**Win screen:** Full-screen overlay (dark semi-transparent backdrop) with a centered card showing "Puzzle Solved!", move count, and a "Play Again" button that resets.

---

## Component Tree

```
App
├── GameProvider (useReducer state + dispatch)
├── Header (title)
├── BoardContainer
│   ├── Board
│   │   └── Square (×24)
│   │       ├── Piece (SVG, if occupied)
│   │       └── MoveIndicator (dot/ring, if legal move)
├── SidePanel
│   ├── MoveCounter
│   ├── UndoButton
│   └── ResetButton
└── WinScreen (conditional overlay)
```

---

## File Structure

```
ChessPuzzle4Pawns/
├── index.html
├── vite.config.ts
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── game/
│   │   ├── initialState.ts      — INITIAL_BOARD constant
│   │   ├── reducer.ts           — useReducer actions
│   │   └── legalMoves.ts        — move calculation per piece type
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── Square.tsx
│   │   ├── Piece.tsx
│   │   ├── SidePanel.tsx
│   │   ├── MoveCounter.tsx
│   │   └── WinScreen.tsx
│   ├── pieces/                  — cburnett SVG files
│   │   ├── wN.svg
│   │   ├── wR.svg
│   │   ├── wB.svg
│   │   ├── wP.svg
│   │   └── bP.svg
│   └── index.css                — global styles, board theme vars
```

---

## Styling

- **Background:** Dark (`#0f0f1a`) full-viewport
- **Board border:** Subtle rounded border with a slight shadow
- **Font:** Serif for title (e.g. Georgia), sans-serif for UI labels
- **Side panel:** Dark card (`#1e1e30`), muted borders, purple accent for move count
- **Buttons:** Minimal, ghost style — border + text, hover brightens
- **Win screen:** Backdrop `rgba(0,0,0,0.75)`, card with animation (fade + scale in)
- **Transitions:** Piece moves animate with CSS `transform/opacity` (150ms ease)

---

## Out of Scope

- Black piece movement (black does not move)
- En passant
- Pawn promotion
- Move history display / notation
- Timer
- Hints or solution button
- Persistence (localStorage)
- Mobile/touch optimization (desktop first)
