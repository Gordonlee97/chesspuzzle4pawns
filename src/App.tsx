import { useReducer, useState, useEffect } from 'react';
import { gameReducer } from './game/reducer';
import { makeInitialGameState } from './game/initialState';
import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { WinScreen } from './components/WinScreen';

const STORAGE_KEY = 'fourPawns_bestScore';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialGameState);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v !== null ? parseInt(v, 10) : null;
  });
  const [winScreenOpen, setWinScreenOpen] = useState(false);

  useEffect(() => {
    if (!state.won) return;
    setWinScreenOpen(true);
    if (bestScore === null || state.moveCount < bestScore) {
      setBestScore(state.moveCount);
      localStorage.setItem(STORAGE_KEY, String(state.moveCount));
    }
  }, [state.won]);

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setWinScreenOpen(false);
  };

  return (
    <div className="app">
      <div className="game-container">
        <header className="game-header">
          <h1 className="game-title">Four Pawns</h1>
          <p className="game-subtitle">A chess puzzle</p>
        </header>
        <div className="game-body">
          <Board state={state} dispatch={dispatch} />
          <SidePanel
            state={state}
            dispatch={dispatch}
            bestScore={bestScore}
            showPlayAgain={state.won && !winScreenOpen}
            onPlayAgain={handleReset}
          />
        </div>
      </div>
      {winScreenOpen && (
        <WinScreen
          moveCount={state.moveCount}
          onReset={handleReset}
          onClose={() => setWinScreenOpen(false)}
        />
      )}
    </div>
  );
}
