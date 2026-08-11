"use client";
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '../Button';

/** Shows after every voting round: vote tally, eliminated player + their role, then next action */
export function VoteResult() {
  const { gameState, proceedToNight, startDiscussion } = useSocket();
  if (!gameState) return null;

  const tally = gameState.voteTally ?? [];
  const eliminated = gameState.eliminatedThisRound;
  const eliminatedRole = gameState.eliminatedRoleThisRound;
  const isRound1Result = gameState.currentState === 'ROUND_1_RESULT';
  const aliveCount = gameState.players.filter(p => p.status === 'ALIVE').length;
  const totalVoters = Math.max(1, aliveCount + (eliminated ? 1 : 0)); // include eliminated voter

  // Role badge styling
  const roleBadge = (role: string | null) => {
    if (role === 'MAFIA') return 'bg-primary text-white';
    if (role === 'INVESTIGATOR') return 'bg-amber-600 text-white';
    return 'bg-blue-600 text-white';
  };

  // Button action: Round 1 result → reveals roles next, Round 2+ result → night begins
  const handleNext = () => {
    if (isRound1Result) {
      // Transition: ROUND_1_RESULT → ROLE_REVEAL (via proceedToNight on server)
      proceedToNight();
    } else {
      // Transition: ROUND_RESULT → NIGHT (via proceedToNight on server)
      proceedToNight();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6 pt-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Round {gameState.currentRound} · Vote Result
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Results Are In</h1>
        </div>

        {/* Elimination announcement — MOST PROMINENT */}
        <div className={`rounded-3xl p-6 text-center mb-5 ${eliminated ? 'bg-primary' : 'bg-gray-100'}`}>
          {eliminated ? (
            <>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Player Eliminated</p>
              <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{eliminated}</h2>
              <div className="mb-2">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Their Role Was</p>
                <div className={`inline-block px-5 py-2 rounded-full font-extrabold text-base uppercase tracking-widest ${roleBadge(eliminatedRole)}`}>
                  {eliminatedRole}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-3xl mb-3">🤝</p>
              <h2 className="text-2xl font-bold text-gray-700">No Elimination</h2>
              <p className="text-sm text-gray-500 mt-1">It was a tie — no player was removed.</p>
            </>
          )}
        </div>

        {/* If this player was eliminated, show their status */}
        {gameState.myStatus === 'DEAD' && eliminated && (
          <div className="bg-gray-900 rounded-2xl p-4 text-center mb-4">
            <p className="text-white font-bold text-base">👻 You have been eliminated</p>
            <p className="text-gray-400 text-sm mt-1">You can watch the rest of the game.</p>
          </div>
        )}

        {/* Vote tally */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vote Tally</p>
          {tally.length === 0 ? (
            <p className="text-gray-400 text-center font-medium py-2">No votes were cast.</p>
          ) : (
            <div className="space-y-3">
              {tally.map((entry, i) => {
                const pct = Math.round((entry.count / totalVoters) * 100);
                const isTop = i === 0 && entry.name !== 'NO_VOTE';
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isTop ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {entry.name === 'NO_VOTE' ? '—' : entry.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className={`font-bold text-sm ${isTop ? 'text-primary' : 'text-gray-900'}`}>
                          {entry.name === 'NO_VOTE' ? 'No Vote' : entry.name}
                        </span>
                        <span className="font-bold text-sm text-gray-500">{entry.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${isTop ? 'bg-primary' : 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alive count */}
        <div className="flex gap-3 mb-2">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-xl font-extrabold text-gray-900">{aliveCount}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Alive</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-xl font-extrabold text-primary">{gameState.players.filter(p => p.status === 'DEAD').length}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">Eliminated</p>
          </div>
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button onClick={handleNext}>
          {isRound1Result ? 'REVEAL YOUR ROLE →' : 'PROCEED TO NIGHT →'}
        </Button>
      </div>
    </div>
  );
}
