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
