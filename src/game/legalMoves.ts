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
