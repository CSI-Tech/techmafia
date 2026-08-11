"use client";
import { useSocket } from '@/components/providers/SocketContext';
import { Timer } from '../Timer';
import { StageHeader } from '../StageHeader';

export function Discussion() {
  const { gameState } = useSocket();
  if (!gameState) return null;

  const isDead = gameState.myStatus === 'DEAD';
  const isRound1 = gameState.currentState === 'ROUND_1_DISCUSSION';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col items-center p-6">
        <StageHeader
          stage="Discussion"
          round={gameState.currentRound}
          title={isRound1 ? 'Round 1 Discussion' : `Round ${gameState.currentRound} Discussion`}
          subtitle="Discuss and identify the Mafia. No phones — face to face only."
        />

        {/* Dead spectator banner */}
        {isDead && (
          <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 my-4 text-center">
            <p className="font-bold text-white text-sm">👻 You are eliminated</p>
            <p className="text-xs text-gray-400 mt-1">Watch quietly as the game continues.</p>
          </div>
        )}

        {/* Large timer */}
        <div className="flex-1 flex items-center justify-center py-8">
          <Timer timerEndsAt={gameState.timerEndsAt} totalSeconds={90} size="lg" />
        </div>

        {/* Role reminder for alive players */}
        {!isDead && gameState.myRole && (
          <div className={`w-full rounded-2xl border p-4 mb-4 ${
            gameState.myRole === 'MAFIA' ? 'bg-red-50 border-red-100' :
            gameState.myRole === 'INVESTIGATOR' ? 'bg-amber-50 border-amber-100' :
            'bg-blue-50 border-blue-100'
          }`}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Your Role</p>
            <p className={`font-extrabold text-base ${
              gameState.myRole === 'MAFIA' ? 'text-primary' :
              gameState.myRole === 'INVESTIGATOR' ? 'text-amber-600' :
              'text-blue-600'
            }`}>{gameState.myRole}</p>
            {gameState.myWord && (
              <p className="text-xs text-gray-500 font-medium mt-0.5">Word: <span className="font-bold text-gray-700">{gameState.myWord}</span></p>
            )}
          </div>
        )}

        {/* Instructions card */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Discussion Rules</p>
          <ul className="space-y-2 text-sm text-gray-600 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Describe your secret word without saying it directly.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Someone has a slightly different word — find them.
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
