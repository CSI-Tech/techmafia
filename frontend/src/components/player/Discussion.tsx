import { useSocket } from '../../services/SocketContext';
import { Timer } from '../Timer';
import { StageHeader } from '../StageHeader';

export function Discussion() {
  const { gameState } = useSocket();
  if (!gameState) return null;

  const isDead = gameState.myStatus === 'DEAD';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col items-center p-6">
        <StageHeader
          stage="Stage 1"
          round={gameState.currentRound}
          title="Discussion"
          subtitle="Discuss your words and try to identify the Mafia."
        />

        {isDead && (
          <div className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 my-4 text-center">
            <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">👻 You have been eliminated</span>
            <p className="text-xs text-gray-400 mt-1">Watch quietly as the game continues.</p>
          </div>
        )}

        {/* Large timer */}
        <div className="flex-1 flex items-center justify-center py-8">
          <Timer timerEndsAt={gameState.timerEndsAt} totalSeconds={90} size="lg" />
        </div>

        {/* Instructions card */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How to Play</p>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Describe your secret word without saying it directly.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Listen carefully — someone has a slightly different word.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              No phones, no chats — discuss face to face.
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 font-medium pb-4">
          Voting starts automatically when the timer ends.
        </p>
      </div>
    </div>
  );
}
