import { useSocket } from '../../services/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';

export function GameResult() {
  const { gameState } = useSocket();
  const navigate = useNavigate();
  if (!gameState) return null;

  const isCivWin = gameState.winner === 'CIVILIANS';
  const rounds = gameState.currentRound;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Result header bar */}
      <div className={`p-8 text-center ${isCivWin ? 'bg-blue-600' : 'bg-primary'}`}>
        <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Game Over</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          {isCivWin ? 'CIVILIANS WIN!' : 'MAFIA WINS!'}
        </h1>
        <p className="text-white/70 text-sm font-medium mt-2">
          {isCivWin ? 'The Mafia have been eliminated.' : 'The Mafia have taken control.'}
        </p>

        {/* Stats row */}
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
            <p className="text-3xl font-extrabold text-white">{gameState.players.filter(p => p.status === 'DEAD').length}</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Eliminated</p>
          </div>
        </div>
      </div>

      {/* Role reveal list */}
      <div className="flex-1 p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Player Results</p>

        {gameState.revealedRoles ? (
          <div className="space-y-3">
            {gameState.revealedRoles.map((p, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                p.role === 'MAFIA' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  p.role === 'MAFIA' ? 'bg-primary text-white' : 'bg-blue-600 text-white'
                }`}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className="flex-1 font-bold text-gray-900 text-base">{p.name}</span>
                <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                  p.role === 'MAFIA' ? 'bg-primary text-white' : 'bg-blue-600 text-white'
                }`}>
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 font-medium">Results are being loaded...</p>
        )}
      </div>

      <div className="p-6 pb-10">
        <Button variant="ghost" onClick={() => navigate('/')}>Play Again</Button>
      </div>
    </div>
  );
}
