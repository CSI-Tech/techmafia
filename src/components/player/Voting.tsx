"use client";
import { useState } from 'react';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '../Button';
import { Timer } from '../Timer';
import { StageHeader } from '../StageHeader';

export function Voting() {
  const { gameState, submitVote } = useSocket();
  const [selected, setSelected] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!gameState) return null;

  const isDead = gameState.myStatus === 'DEAD';
  const alivePlayers = gameState.players.filter(p => p.status === 'ALIVE');

  const handleSubmit = () => {
    if (!selected || hasSubmitted) return;
    submitVote(selected);
    setHasSubmitted(true);
  };

  // ── Dead player spectator ────────────────────────────────────────────────
  if (isDead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-6">
        <div className="text-center space-y-2">
          <p className="text-4xl">👻</p>
          <h2 className="text-2xl font-extrabold text-gray-900">You Are Eliminated</h2>
          <p className="text-gray-400 font-medium">Voting is in progress. Watch quietly.</p>
        </div>
        <div className="w-full max-w-xs">
          <Timer timerEndsAt={gameState.timerEndsAt} totalSeconds={30} size="lg" />
        </div>
      </div>
    );
  }

  // ── Submitted confirmation ────────────────────────────────────────────────
  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Vote Submitted</h2>
          <p className="text-gray-400 font-medium">
            You voted for:{' '}
            <span className="text-gray-900 font-bold">
              {selected === 'NO_VOTE' ? 'No Vote' : selected}
            </span>
          </p>
          <p className="text-gray-400 text-sm">Your vote has been recorded. Waiting for others...</p>
        </div>
        <Timer timerEndsAt={gameState.timerEndsAt} totalSeconds={30} size="sm" />
      </div>
    );
  }

  // ── Voting screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6">
        <StageHeader
          stage="Voting"
          round={gameState.currentRound}
          title="Who Is Suspicious?"
          subtitle="Vote for the player you believe is Mafia."
        />

        {/* Timer */}
        <div className="flex justify-center my-4">
          <Timer timerEndsAt={gameState.timerEndsAt} totalSeconds={30} size="sm" />
        </div>

        {/* Player options */}
        <div className="space-y-2.5 mt-2">
          {alivePlayers.map(player => {
            const isMe = player.id === gameState.myId;
            if (isMe) return null; // Can't vote for yourself
            return (
              <button
                key={player.id}
                onClick={() => setSelected(player.name)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                  selected === player.name
                    ? 'bg-red-50 border-primary shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  selected === player.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {player.name[0].toUpperCase()}
                </div>
                <span className={`font-bold text-lg flex-1 ${selected === player.name ? 'text-primary' : 'text-gray-900'}`}>
                  {player.name}
                </span>
                {selected === player.name && (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* No Vote option */}
          <button
            onClick={() => setSelected('NO_VOTE')}
            className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.98] mt-1 ${
              selected === 'NO_VOTE'
                ? 'bg-gray-100 border-gray-400'
                : 'bg-white border-dashed border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-bold text-base ${selected === 'NO_VOTE' ? 'text-gray-800' : 'text-gray-400'}`}>
              — No Vote
            </span>
          </button>
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button disabled={!selected} onClick={handleSubmit}>
          SUBMIT VOTE
        </Button>
      </div>
    </div>
  );
}
