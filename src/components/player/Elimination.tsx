import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '../Button';

export function Elimination() {
  const { gameState, startDiscussion } = useSocket();
  if (!gameState) return null;

  // Count alive players
  const aliveCount = gameState.players.filter(p => p.status === 'ALIVE').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">

        {gameState.eliminatedThisRound ? (
          <>
            {/* Eliminated player card */}
            <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto text-3xl font-extrabold text-gray-500">
                {gameState.eliminatedThisRound[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Eliminated</p>
                <h2 className="text-3xl font-extrabold text-gray-900">{gameState.eliminatedThisRound}</h2>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role Revealed</p>
                <div className={`inline-block px-6 py-2 rounded-full font-extrabold text-sm uppercase tracking-wider ${
                  gameState.eliminatedRoleThisRound === 'MAFIA'
                    ? 'bg-primary text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {gameState.eliminatedRoleThisRound}
                </div>
              </div>
            </div>

            {/* Status for this player */}
            {gameState.myStatus === 'DEAD' && (
              <div className="w-full bg-gray-100 rounded-2xl p-5 text-center">
                <p className="text-xl font-extrabold text-gray-700">You Have Been Eliminated</p>
                <p className="text-sm text-gray-400 mt-1">You can watch the rest of the game.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-extrabold text-gray-900">No Elimination</h2>
            <p className="text-gray-400 font-medium">It was a tie — no one was removed.</p>
          </div>
        )}

        {/* Alive count */}
        <div className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" />
          </svg>
          <span className="text-sm font-bold text-gray-700">{aliveCount} players remaining</span>
        </div>

        <p className="text-sm text-gray-400 font-medium text-center px-4">
          Round {gameState.currentRound + 1} begins next.
        </p>
      </div>

      <div className="p-6 pb-10">
        <Button onClick={startDiscussion}>START ROUND {gameState.currentRound + 1}</Button>
      </div>
    </div>
  );
}
