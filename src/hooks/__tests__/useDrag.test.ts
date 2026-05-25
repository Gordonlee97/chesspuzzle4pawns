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
