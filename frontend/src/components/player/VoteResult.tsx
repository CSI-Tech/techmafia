import { useSocket } from '../../services/SocketContext';
import { Button } from '../Button';
import { StageHeader } from '../StageHeader';

export function VoteResult() {
  const { gameState, proceedToWinCheck } = useSocket();
  if (!gameState) return null;

  const tally = gameState.voteTally ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6">
        <StageHeader
          stage="Vote Result"
          round={gameState.currentRound}
          title="Results Are In"
        />

        {/* Vote tally */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mt-6 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vote Tally</p>
          {tally.length === 0 && (
            <p className="text-gray-400 text-center font-medium py-4">No votes were cast.</p>
          )}
          {tally.map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                {entry.name !== 'NO_VOTE' ? entry.name[0].toUpperCase() : '—'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-gray-900">{entry.name === 'NO_VOTE' ? 'No Vote' : entry.name}</span>
                  <span className="font-bold text-sm text-gray-500">{entry.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(entry.count / gameState.players.filter(p=>p.status==='ALIVE').length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Elimination banner */}
        <div className={`mt-6 rounded-3xl p-6 text-center space-y-2 ${
          gameState.eliminatedThisRound ? 'bg-primary' : 'bg-gray-100'
        }`}>
          {gameState.eliminatedThisRound ? (
            <>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Eliminated</p>
              <h2 className="text-4xl font-extrabold text-white">{gameState.eliminatedThisRound}</h2>
              <div className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mt-1">
                {gameState.eliminatedRoleThisRound}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-700">No One Eliminated</h2>
              <p className="text-sm text-gray-500">It was a tie — the round continues.</p>
            </>
          )}
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button onClick={proceedToWinCheck}>CONTINUE</Button>
      </div>
    </div>
  );
}
