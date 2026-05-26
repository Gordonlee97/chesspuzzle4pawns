import type { Dispatch } from 'react';
import type { Action, GameState } from '../game/types';

type SidePanelProps = {
  state: GameState;
  dispatch: Dispatch<Action>;
  bestScore: number | null;
  showPlayAgain: boolean;
  onPlayAgain: () => void;
};

export function SidePanel({ state, dispatch, bestScore, showPlayAgain, onPlayAgain }: SidePanelProps) {
  const canUndo = state.history.length > 0;

  return (
    <div className="side-panel">
      <div className="move-counter">
        <span className="move-counter__label">MOVES</span>
        <span className="move-counter__value">{state.moveCount}</span>
      </div>
      {showPlayAgain ? (
        <button className="btn" onClick={onPlayAgain}>
          ↺ Play Again
        </button>
      ) : (
        <>
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
        </>
      )}
      <p className="best-score">
        Best: {bestScore !== null ? bestScore : '—'}
      </p>
    </div>
  );
}
