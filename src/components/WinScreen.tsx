type WinScreenProps = {
  moveCount: number;
  onReset: () => void;
};

export function WinScreen({ moveCount, onReset }: WinScreenProps) {
  return (
    <div className="win-overlay">
      <div className="win-card">
        <div className="win-icon">♞</div>
        <h2 className="win-title">Puzzle Solved!</h2>
        <p className="win-moves">
          Completed in <strong>{moveCount}</strong> {moveCount === 1 ? 'move' : 'moves'}
        </p>
        <button className="btn btn--play-again" onClick={onReset}>
          Play Again
        </button>
      </div>
    </div>
  );
}
