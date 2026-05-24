import { useReducer } from 'react';
import { gameReducer } from './game/reducer';
import { makeInitialGameState } from './game/initialState';
import { Board } from './components/Board';
import { SidePanel } from './components/SidePanel';
import { WinScreen } from './components/WinScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialGameState);

  return (
    <div className="app">
      <div className="game-container">
        <header className="game-header">
          <h1 className="game-title">Four Pawns</h1>
          <p className="game-subtitle">A chess puzzle</p>
        </header>
        <div className="game-body">
          <Board state={state} dispatch={dispatch} />
          <SidePanel state={state} dispatch={dispatch} />
        </div>
      </div>
      {state.won && (
        <WinScreen
          moveCount={state.moveCount}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}
    </div>
  );
}
