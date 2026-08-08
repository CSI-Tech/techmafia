import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../services/SocketContext';
import { Button } from '../components/Button';

export function JoinPage() {
  const [teamCode, setTeamCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [localError, setLocalError] = useState('');
  const { joinRoom, gameState, error, clearError } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState) navigate('/game');
  }, [gameState, navigate]);

  const handleJoin = () => {
    clearError();
    setLocalError('');
    if (!teamCode.trim()) { setLocalError('Enter a team code'); return; }
    if (!roomCode.trim()) { setLocalError('Enter a room code'); return; }
    if (!playerName.trim()) { setLocalError('Enter your name'); return; }
    joinRoom(teamCode.trim(), roomCode.trim(), playerName.trim());
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6 pt-12">
        {/* Logo / Title */}
        <div className="text-center space-y-1 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-white text-3xl font-extrabold">M</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MAFIA</h1>
          <p className="text-sm text-gray-400 font-medium">The social deduction game</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Join a Game</h2>

          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {displayError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Team Code</label>
            <input
              type="text"
              value={teamCode}
              onChange={e => setTeamCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="TEAM05"
              maxLength={10}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center tracking-widest focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="K7M2PX"
              maxLength={6}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center tracking-widest focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="e.g. Alex"
              maxLength={20}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="p-6 pb-10">
        <Button onClick={handleJoin}>JOIN GAME</Button>
      </div>
    </div>
  );
}
