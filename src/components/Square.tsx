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
