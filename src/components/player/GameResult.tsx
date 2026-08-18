"use client";
import { useSocket } from '@/components/providers/SocketContext';
import { useRouter } from 'next/navigation';
import { Button } from '../Button';

export function GameResult() {
  const { gameState, resetSession } = useSocket();
  const router = useRouter();
  if (!gameState) return null;

  const isCivWin = gameState.winner === 'CIVILIANS';
  const rounds = gameState.currentRound;
  const eliminated = gameState.players.filter(p => p.status === 'DEAD').length;

  const advancingList = gameState.revealedRoles
    ? gameState.revealedRoles.filter(p => gameState.advancingPlayers?.includes(p.id))
    : [];

  const allRoles = gameState.revealedRoles ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Winner banner */}
      <div className={`p-8 pb-10 text-center ${isCivWin ? 'bg-blue-600' : 'bg-primary'}`}>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Game Over</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          {isCivWin ? '🏆 CIVILIANS WIN' : '💀 MAFIA WINS'}
        </h1>
        <p className="text-white/80 text-sm font-semibold">
          {isCivWin
            ? 'All Mafia have been eliminated.'
            : 'The Mafia have taken control.'}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{rounds}</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Rounds</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{gameState.players.length}</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Players</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{eliminated}</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Eliminated</p>
          </div>
        </div>
      </div>

      {/* Players Moving Forward */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Players Moving Forward — {advancingList.length} {advancingList.length === 1 ? 'Player' : 'Players'}
        </p>
        {advancingList.length > 0 ? (
          <div className="space-y-2">
            {advancingList.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <span className="font-bold text-gray-900 flex-1">{p.name}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  p.role === 'MAFIA' ? 'bg-primary/10 text-primary' :
                  p.role === 'INVESTIGATOR' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No players advance.</p>
        )}
      </div>

      {/* Full player results */}
      <div className="flex-1 p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">All Player Roles</p>
        <div className="space-y-2.5">
          {allRoles.map((p, i) => {
            const playerData = gameState.players.find(gp => gp.id === p.id);
            const isDead = playerData?.status === 'DEAD';
            const isAdvancing = gameState.advancingPlayers?.includes(p.id);

            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                isDead ? 'bg-gray-50 border-gray-100 opacity-60' :
                p.role === 'MAFIA' ? 'bg-red-50 border-red-100' :
                p.role === 'INVESTIGATOR' ? 'bg-amber-50 border-amber-100' :
                'bg-blue-50 border-blue-100'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isDead ? 'bg-gray-200 text-gray-500' :
                  p.role === 'MAFIA' ? 'bg-primary text-white' :
                  p.role === 'INVESTIGATOR' ? 'bg-amber-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className={`font-bold text-base ${isDead ? 'text-gray-500' : 'text-gray-900'}`}>
                    {p.name}
                    {isDead && <span className="text-red-400 text-xs font-semibold ml-2">(DEAD)</span>}
                    {isAdvancing && <span className="text-green-600 text-xs font-semibold ml-2">→ ADVANCING</span>}
                  </span>
                </div>
                <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                  p.role === 'MAFIA' ? 'bg-primary text-white' :
                  p.role === 'INVESTIGATOR' ? 'bg-amber-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {p.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button
          variant="ghost"
          onClick={() => {
            resetSession();
            router.push('/');
          }}
        >
          Play Again
        </Button>
      </div>
    </div>
  );
}
