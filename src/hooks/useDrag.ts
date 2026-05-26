// src/hooks/useDrag.ts
import { useState, useRef, useCallback, useEffect } from 'react';
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

  // Stored so the unmount cleanup effect can remove them if a drag is in progress.
  const moveListenerRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const upListenerRef = useRef<((ev: MouseEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (moveListenerRef.current) window.removeEventListener('mousemove', moveListenerRef.current);
      if (upListenerRef.current) window.removeEventListener('mouseup', upListenerRef.current);
    };
  }, []);

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
        moveListenerRef.current = null;
        upListenerRef.current = null;

        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const squareEl = el?.closest('[data-row]');
        if (squareEl) {
          const toRow = parseInt(squareEl.getAttribute('data-row') ?? '-1', 10);
          const toCol = parseInt(squareEl.getAttribute('data-col') ?? '-1', 10);
          // -1 will never match a legal move, so invalid attributes fail silently.
          if (legalMovesRef.current.some(m => m.row === toRow && m.col === toCol)) {
            dispatch({ type: 'MOVE', row: toRow, col: toCol });
          }
        }

        setDragState({ dragging: false, origin: null, mousePos: null });
      };

      moveListenerRef.current = onMouseMove;
      upListenerRef.current = onMouseUp;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [dispatch]
  );

  return { dragState, startDrag };
}
