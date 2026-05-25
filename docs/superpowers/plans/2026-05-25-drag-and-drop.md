# Drag-and-Drop Piece Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lichess-style drag-and-drop piece movement while keeping click-to-move working.

**Architecture:** A `useDrag` hook in `Board` tracks drag state (origin square, mouse position) and wires `window` mousemove/mouseup listeners. On drop, it uses `document.elementFromPoint` + `data-row`/`data-col` attributes to identify the target square, dispatches `MOVE` if legal or clears state if not. A `position: fixed` floating image follows the cursor; the origin square's piece goes semi-transparent while dragging.

**Tech Stack:** React 19, TypeScript, Vitest + @testing-library/react, Vite

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/hooks/useDrag.ts` | **Create** | All drag state and window event wiring |
| `src/hooks/__tests__/useDrag.test.ts` | **Create** | Unit tests for useDrag |
| `src/components/Piece.tsx` | **Modify** | Export PIECE_SRC; accept `onMouseDown` and `ghost` props |
| `src/components/Square.tsx` | **Modify** | Add `data-row`/`data-col`; accept `onPieceMouseDown` and `isDragOrigin` |
| `src/components/Board.tsx` | **Modify** | Wire useDrag; pass new props; render floating piece |
| `src/index.css` | **Modify** | Remove `pointer-events: none` from `.piece`; add `.piece--ghost` and `.piece--floating` |

---

## Task 1: Write failing useDrag tests

**Files:**
- Create: `src/hooks/__tests__/useDrag.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// src/hooks/__tests__/useDrag.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrag } from '../useDrag';
import type { Dispatch } from 'react';
import type { Action, Position } from '../../game/types';

describe('useDrag', () => {
  let dispatch: Dispatch<Action>;

  beforeEach(() => {
    dispatch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('initial state is idle', () => {
    const { result } = renderHook(() => useDrag([], dispatch));
    expect(result.current.dragState.dragging).toBe(false);
    expect(result.current.dragState.origin).toBeNull();
    expect(result.current.dragState.mousePos).toBeNull();
  });

  test('startDrag sets dragging state and dispatches SELECT', () => {
    const { result } = renderHook(() => useDrag([], dispatch));
    const fakeEvent = { clientX: 100, clientY: 200, preventDefault: vi.fn() };

    act(() => {
      result.current.startDrag(3, 0, fakeEvent);
    });

    expect(result.current.dragState.dragging).toBe(true);
    expect(result.current.dragState.origin).toEqual({ row: 3, col: 0 });
    expect(result.current.dragState.mousePos).toEqual({ x: 100, y: 200 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT', row: 3, col: 0 });
  });

  test('window mousemove updates mousePos while dragging', () => {
    const { result } = renderHook(() => useDrag([], dispatch));

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
    });

    expect(result.current.dragState.mousePos).toEqual({ x: 150, y: 250 });
  });

  test('mouseup on legal square dispatches MOVE and clears drag state', () => {
    const legalMoves: Position[] = [{ row: 2, col: 0 }];
    const { result } = renderHook(() => useDrag(legalMoves, dispatch));

    const squareEl = document.createElement('div');
    squareEl.setAttribute('data-row', '2');
    squareEl.setAttribute('data-col', '0');
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(squareEl);

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 120, clientY: 160 }));
    });

    expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE', row: 2, col: 0 });
    expect(result.current.dragState.dragging).toBe(false);
    expect(result.current.dragState.origin).toBeNull();
  });

  test('mouseup on illegal square does not dispatch MOVE and clears drag state', () => {
    const legalMoves: Position[] = [{ row: 2, col: 0 }];
    const { result } = renderHook(() => useDrag(legalMoves, dispatch));

    const squareEl = document.createElement('div');
    squareEl.setAttribute('data-row', '4');
    squareEl.setAttribute('data-col', '3');
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(squareEl);

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 350, clientY: 400 }));
    });

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'MOVE' }));
    expect(result.current.dragState.dragging).toBe(false);
  });

  test('mouseup outside board (no data-row element) does not dispatch MOVE', () => {
    const legalMoves: Position[] = [{ row: 2, col: 0 }];
    const { result } = renderHook(() => useDrag(legalMoves, dispatch));

    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 999, clientY: 999 }));
    });

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'MOVE' }));
    expect(result.current.dragState.dragging).toBe(false);
  });

  test('window listeners are removed after mouseup', () => {
    const { result } = renderHook(() => useDrag([], dispatch));

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    const removeSpy = vi.spyOn(window, 'removeEventListener');

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 200 }));
    });

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  test('mousemove does not update state after mouseup', () => {
    const { result } = renderHook(() => useDrag([], dispatch));

    act(() => {
      result.current.startDrag(3, 0, { clientX: 100, clientY: 200, preventDefault: vi.fn() });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 200 }));
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999 }));
    });

    expect(result.current.dragState.mousePos).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they all fail**

```bash
npm test -- src/hooks/__tests__/useDrag.test.ts
```

Expected: All 7 tests fail with "Cannot find module '../useDrag'"

---

## Task 2: Implement useDrag hook

**Files:**
- Create: `src/hooks/useDrag.ts`

- [ ] **Step 1: Create the hooks directory and hook file**

```typescript
// src/hooks/useDrag.ts
import { useState, useRef, useCallback } from 'react';
import type { Dispatch } from 'react';
import type { Action, Position } from '../game/types';

type MousePos = { x: number; y: number };

export type DragState = {
  dragging: boolean;
  origin: Position | null;
  mousePos: MousePos | null;
};

type DragEvent = { clientX: number; clientY: number; preventDefault(): void };

export function useDrag(legalMoves: Position[], dispatch: Dispatch<Action>) {
  const [dragState, setDragState] = useState<DragState>({
    dragging: false,
    origin: null,
    mousePos: null,
  });

  // Ref keeps the mouseup closure from capturing a stale legalMoves snapshot.
  const legalMovesRef = useRef(legalMoves);
  legalMovesRef.current = legalMoves;

  const startDrag = useCallback(
    (row: number, col: number, e: DragEvent) => {
      e.preventDefault();
      setDragState({ dragging: true, origin: { row, col }, mousePos: { x: e.clientX, y: e.clientY } });
      dispatch({ type: 'SELECT', row, col });

      const onMouseMove = (ev: MouseEvent) => {
        setDragState(prev => ({ ...prev, mousePos: { x: ev.clientX, y: ev.clientY } }));
      };

      const onMouseUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const squareEl = el?.closest('[data-row]');
        if (squareEl) {
          const toRow = parseInt(squareEl.getAttribute('data-row') ?? '-1', 10);
          const toCol = parseInt(squareEl.getAttribute('data-col') ?? '-1', 10);
          if (legalMovesRef.current.some(m => m.row === toRow && m.col === toCol)) {
            dispatch({ type: 'MOVE', row: toRow, col: toCol });
          }
        }

        setDragState({ dragging: false, origin: null, mousePos: null });
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [dispatch]
  );

  return { dragState, startDrag };
}
```

- [ ] **Step 2: Run tests to verify they all pass**

```bash
npm test -- src/hooks/__tests__/useDrag.test.ts
```

Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDrag.ts src/hooks/__tests__/useDrag.test.ts
git commit -m "feat: add useDrag hook with tests"
```

---

## Task 3: Update Piece component

**Files:**
- Modify: `src/components/Piece.tsx`

- [ ] **Step 1: Replace the full file contents**

```tsx
// src/components/Piece.tsx
import type { MouseEvent } from 'react';
import type { PieceType } from '../game/types';
import wNSrc from '../pieces/wN.svg';
import wRSrc from '../pieces/wR.svg';
import wBSrc from '../pieces/wB.svg';
import wPSrc from '../pieces/wP.svg';
import bPSrc from '../pieces/bP.svg';

export const PIECE_SRC: Record<PieceType, string> = {
  wN: wNSrc,
  wR: wRSrc,
  wB: wBSrc,
  wP: wPSrc,
  bP: bPSrc,
};

type PieceProps = {
  type: PieceType;
  onMouseDown?: (e: MouseEvent<HTMLImageElement>) => void;
  ghost?: boolean;
};

export function Piece({ type, onMouseDown, ghost }: PieceProps) {
  return (
    <img
      src={PIECE_SRC[type]}
      alt={type}
      className={ghost ? 'piece piece--ghost' : 'piece'}
      draggable={false}
      onMouseDown={onMouseDown}
    />
  );
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: All tests PASS (Piece has no unit tests; game logic tests unaffected)

---

## Task 4: Update Square component

**Files:**
- Modify: `src/components/Square.tsx`

- [ ] **Step 1: Replace the full file contents**

```tsx
// src/components/Square.tsx
import type { MouseEvent } from 'react';
import type { Action, Cell } from '../game/types';
import type { Dispatch } from 'react';
import { Piece } from './Piece';

type SquareProps = {
  cell: Cell;
  row: number;
  col: number;
  isSelected: boolean;
  isLegalMove: boolean;
  dispatch: Dispatch<Action>;
  onPieceMouseDown?: (e: MouseEvent<HTMLImageElement>) => void;
  isDragOrigin?: boolean;
};

export function Square({
  cell, row, col, isSelected, isLegalMove, dispatch, onPieceMouseDown, isDragOrigin,
}: SquareProps) {
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
    <div className={squareClass} onClick={handleClick} data-row={row} data-col={col}>
      {cell.piece && (
        <Piece
          type={cell.piece}
          onMouseDown={cell.piece.startsWith('w') ? onPieceMouseDown : undefined}
          ghost={isDragOrigin}
        />
      )}
      {isLegalMove && !isCapture && <div className="move-dot" />}
      {isLegalMove && isCapture && <div className="move-ring" />}
    </div>
  );
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: All tests PASS

---

## Task 5: Update Board component

**Files:**
- Modify: `src/components/Board.tsx`

- [ ] **Step 1: Replace the full file contents**

```tsx
// src/components/Board.tsx
import type { Dispatch, MouseEvent } from 'react';
import type { Action, GameState, PieceType } from '../game/types';
import { Square } from './Square';
import { useDrag } from '../hooks/useDrag';
import { PIECE_SRC } from './Piece';

type BoardProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
};

export function Board({ state, dispatch }: BoardProps) {
  const { dragState, startDrag } = useDrag(state.legalMoves, dispatch);

  const floatingPiece =
    dragState.dragging && dragState.origin
      ? state.board[dragState.origin.row][dragState.origin.col].piece
      : null;

  return (
    <>
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
              onPieceMouseDown={(e: MouseEvent<HTMLImageElement>) => startDrag(r, c, e)}
              isDragOrigin={
                dragState.dragging &&
                dragState.origin?.row === r &&
                dragState.origin?.col === c
              }
            />
          ))
        )}
      </div>
      {dragState.dragging && dragState.mousePos && floatingPiece && (
        <img
          src={PIECE_SRC[floatingPiece as PieceType]}
          alt="dragging"
          className="piece piece--floating"
          style={{ left: dragState.mousePos.x, top: dragState.mousePos.y }}
          draggable={false}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: All tests PASS

---

## Task 6: Update CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Remove `pointer-events: none` from `.piece` and add new classes**

Find this block in `src/index.css`:

```css
/* Pieces */
.piece {
  width: 85%;
  height: 85%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
```

Replace it with:

```css
/* Pieces */
.piece {
  width: 85%;
  height: 85%;
  object-fit: contain;
  user-select: none;
}

.piece--ghost {
  opacity: 0.3;
}

.piece--floating {
  position: fixed;
  width: var(--sq-size);
  height: var(--sq-size);
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 200;
  user-select: none;
}
```

- [ ] **Step 2: Run all tests to verify nothing broke**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 3: Commit all component and CSS changes**

```bash
git add src/components/Piece.tsx src/components/Square.tsx src/components/Board.tsx src/index.css
git commit -m "feat: wire drag-and-drop into Board, Square, Piece components"
```

---

## Task 7: Push to GitHub

- [ ] **Step 1: Push branch to origin**

```bash
git push origin master
```

Expected: Branch updates on GitHub, Actions workflow triggers and deploys to GitHub Pages.
