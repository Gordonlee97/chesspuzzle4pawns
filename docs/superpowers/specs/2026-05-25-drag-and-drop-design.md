# Drag-and-Drop Piece Movement

**Date:** 2026-05-25  
**Status:** Approved

## Overview

Replace click-only piece movement with drag-and-drop movement matching the lichess/chess.com feel: mousedown picks up a piece, dragging follows the cursor, mouseup on a legal square commits the move, mouseup elsewhere snaps the piece back. Click-to-move continues to work alongside drag.

## Architecture

### New: `src/hooks/useDrag.ts`

Owns all drag state and event wiring. Returns state and handlers to `Board`.

**State:**
- `dragging: boolean`
- `origin: Position | null` — square the piece was lifted from
- `mousePos: { x: number; y: number } | null` — current cursor viewport coords

**Lifecycle:**
1. `startDrag(row, col, e)` — called on `mousedown` on a piece. Records origin and initial mousePos. Dispatches `SELECT` to populate `legalMoves`.
2. `window` `mousemove` listener (attached while dragging) — updates mousePos.
3. `window` `mouseup` listener (attached while dragging) — calls `document.elementFromPoint(x, y)`, reads `data-row`/`data-col` from the element, dispatches `MOVE` if that position is in `legalMoves`, then clears drag state regardless.

Listeners are added on drag start and removed on drag end to avoid leaks.

### Modified: `src/components/Square.tsx`

- Add `data-row` and `data-col` attributes to the square `<div>` for hit-testing on drop.
- Expose `onPieceMouseDown` prop that calls `useDrag`'s `startDrag`.
- Suppress `onClick` if the pointer moved more than 4px from mousedown position (prevents double-firing when drag completes on same square).

### Modified: `src/components/Piece.tsx`

- Accept and forward `onMouseDown` prop.

### Modified: `src/components/Board.tsx`

- Instantiate `useDrag` hook, pass `startDrag` down to squares.
- Render a floating `<img>` outside the grid when `dragging === true`:  
  `position: fixed; left: mousePos.x; top: mousePos.y; transform: translate(-50%, -50%); z-index: 200; pointer-events: none`
- Pass `isDragging` + `origin` down to squares so the origin square can render its piece at reduced opacity.

### Modified: `src/index.css`

- `.piece--ghost` — `opacity: 0.3` for the origin square piece while dragging.
- `.piece--floating` — `position: fixed; pointer-events: none; z-index: 200; width: var(--sq-size); height: var(--sq-size)` for the dragged piece image.

## Behavior Details

| Scenario | Result |
|---|---|
| Mousedown on own piece, drag to legal square, mouseup | Move committed |
| Mousedown on own piece, drag to illegal square, mouseup | Piece snaps back, selection cleared |
| Mousedown on own piece, mouseup on same square (no move) | SELECT fires — legal move dots appear (existing click flow) |
| Click legal move dot after selecting via click | MOVE fires (existing click flow) |
| Mousedown on empty square or wall | No drag started |
| Mousedown on enemy pawn | No drag started (SELECT will no-op per existing reducer) |

## Out of Scope

- Touch / mobile support
- Keyboard accessibility
- Drag from one piece directly onto another without going through the floating ghost
