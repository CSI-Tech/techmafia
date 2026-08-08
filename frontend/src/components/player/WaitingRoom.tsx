import { useSocket } from '../../services/SocketContext';
import { Button } from '../Button';
import { StageHeader } from '../StageHeader';

export function WaitingRoom() {
  const { gameState, startGame } = useSocket();
  if (!gameState) return null;

  const count = gameState.players.length;
  const isReady = count === 6;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 p-6">
        <StageHeader
          title={isReady ? 'All Players Ready!' : 'Waiting for players...'}
          subtitle={`Team ${gameState.teamId}`}
        />

        {/* Counter */}
        <div className="flex justify-center my-6">
          <div className={`px-8 py-3 rounded-full font-bold text-lg ${isReady ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
            {count} / 6 PLAYERS
          </div>
        </div>

        {/* Player slots */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => {
            const player = gameState.players[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors ${
                  player
                    ? 'bg-white border-gray-100 shadow-sm'
                    : 'bg-gray-50 border-dashed border-gray-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  player ? 'bg-red-100 text-primary' : 'bg-gray-200 text-gray-400'
                }`}>
                  {player ? player.name[0].toUpperCase() : (i + 1)}
                </div>
                <span className={`flex-1 font-semibold text-base ${player ? 'text-gray-900' : 'text-gray-400'}`}>
                  {player ? player.name : 'Waiting...'}
                </span>
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
          <p className="text-center text-sm text-gray-400 font-medium">
            Any player can start the game
          </p>
        )}
        <Button disabled={!isReady} onClick={startGame}>
          {isReady ? 'START GAME' : 'WAITING FOR PLAYERS...'}
        </Button>
      </div>
    </div>
  );
}
