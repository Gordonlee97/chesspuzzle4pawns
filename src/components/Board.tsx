import type { Dispatch } from 'react';
import type { Action, GameState } from '../game/types';
import { Square } from './Square';

type BoardProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
};

export function Board({ state, dispatch }: BoardProps) {
  return (
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
          />
        ))
      )}
    </div>
  );
}
