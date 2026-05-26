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
  const { dragState, startDrag } = useDrag(state.legalMoves, dispatch, state.selected);

  const floatingPiece: PieceType | null =
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
          src={PIECE_SRC[floatingPiece]}
          alt="dragging"
          className="piece piece--floating"
          style={{ left: `${dragState.mousePos.x}px`, top: `${dragState.mousePos.y}px` }}
          draggable={false}
        />
      )}
    </>
  );
}
