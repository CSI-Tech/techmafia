"use client";
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '../Button';

export function WaitingRoom() {
  const { gameState, startGame } = useSocket();
  if (!gameState) return null;

  const maxPlayers = gameState.maxPlayers || 8;
  const count = gameState.players.length;
  const isReady = count >= maxPlayers;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="text-center pt-6 mb-6">
          <div className="inline-block px-4 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {gameState.teamId}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isReady ? 'All Players Ready!' : 'Waiting for players...'}
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {isReady ? 'Any player can start the game.' : 'More players need to join.'}
          </p>
        </div>

        {/* Progress counter */}
        <div className="flex justify-center mb-6">
          <div className={`px-8 py-3 rounded-full font-extrabold text-lg transition-colors ${
            isReady ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700'
          }`}>
            {count} / {maxPlayers} PLAYERS
          </div>
        </div>

        {/* Player slots */}
        <div className="space-y-2.5">
          {Array.from({ length: maxPlayers }).map((_, i) => {
            const player = gameState.players[i];
            const isMe = player?.id === gameState.myId;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  player
                    ? 'bg-white border-gray-100 shadow-sm'
                    : 'bg-gray-50 border-dashed border-gray-200'
                }`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  player ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400'
                }`}>
                  {player ? player.name[0].toUpperCase() : (i + 1)}
                </div>

                {/* Name */}
                <span className={`flex-1 font-semibold text-base ${player ? 'text-gray-900' : 'text-gray-400'}`}>
                  {player
                    ? <>{player.name}{isMe && <span className="text-xs text-primary font-bold ml-2">(You)</span>}</>
                    : 'Waiting...'}
                </span>

                {/* Check */}
                {player && (
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 pb-10 space-y-3">
        {isReady && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
            <p className="text-green-700 font-semibold text-sm">✅ All players have joined!</p>
          </div>
        )}
        <Button disabled={!isReady} onClick={startGame}>
          {isReady ? 'START GAME' : `WAITING FOR PLAYERS... (${count}/${maxPlayers})`}
        </Button>
      </div>
    </div>
  );
}
