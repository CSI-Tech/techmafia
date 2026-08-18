"use client";
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

export function MorningResult() {
  const { gameState, startDiscussion } = useSocket();
  if (!gameState) return null;

  const isDead = gameState.myStatus === 'DEAD';
  const results = gameState.morningResults ?? [];
  const investigatorResult = gameState.investigatorResult;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <div className="h-1 w-full bg-amber-400" />

      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="text-center pt-6 mb-6">
          <p className="text-4xl mb-3">☀️</p>
          <div className="inline-block px-4 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Round {gameState.currentRound - 1} · Night Resolved
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Morning Has Arrived</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{"Here's what happened during the night."}</p>
        </div>

        {/* Dead banner for eliminated players */}
        {isDead && (
          <div className="bg-gray-900 rounded-2xl p-4 text-center mb-4">
            <p className="text-white font-bold text-sm">👻 You are eliminated — watching as spectator</p>
          </div>
        )}

        {/* Public night events */}
        <div className="space-y-3 mb-4">
          {results.length > 0 ? (
            results.map((msg, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${
                  msg.toLowerCase().includes('mafia') ? 'border-red-100' : 'border-amber-100'
                }`}
              >
                <p className="text-gray-800 font-semibold text-base leading-relaxed">{msg}</p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 text-center">
              <p className="text-gray-500 font-medium">No events from last night.</p>
            </div>
          )}
        </div>

        {/* Investigator private result (only visible to the investigator) */}
        {investigatorResult && (
          <div className="bg-amber-100 border border-amber-300 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔍</span>
              <p className="text-amber-800 font-bold text-xs uppercase tracking-wider">Your Investigation Result (Private)</p>
            </div>
            <p className="text-amber-900 font-semibold text-base">{investigatorResult}</p>
            <p className="text-amber-600 text-xs mt-1">Only you can see this.</p>
          </div>
        )}

        {/* Alive counts */}
        <div className="flex gap-3 mt-auto pt-2">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900">
              {gameState.aliveCivilians + gameState.aliveInvestigator}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Civilians</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-red-50 shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{gameState.aliveMafia}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Mafia Left</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900">{gameState.alivePlayers}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Alive</p>
          </div>
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button onClick={startDiscussion}>
          {gameState.winner ? 'VIEW GAME RESULTS →' : `PROCEED TO ROUND ${gameState.currentRound} DISCUSSION`}
        </Button>
      </div>
    </div>
  );
}
