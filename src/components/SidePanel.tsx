import type { Dispatch } from 'react';
import type { Action, GameState } from '../game/types';

type SidePanelProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
};

export function SidePanel({ state, dispatch }: SidePanelProps) {
  const canUndo = state.history.length > 0;

  return (
    <div className="side-panel">
      <div className="move-counter">
        <span className="move-counter__label">MOVES</span>
        <span className="move-counter__value">{state.moveCount}</span>
      </div>
      <button
        className="btn btn--undo"
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo}
      >
        ↩ Undo
      </button>
      <button
        className="btn btn--reset"
        onClick={() => dispatch({ type: 'RESET' })}
      >
        ↺ Reset
      </button>
    </div>
  );
}
