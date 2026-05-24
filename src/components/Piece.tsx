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
