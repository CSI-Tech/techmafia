"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

type Mode = 'SELECT_ROLE' | 'PLAYER' | 'ADMIN';

// In Next.js App Router API routes, we call our own API Route
const BACKEND_URL = '';

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>('SELECT_ROLE');

  // Player fields
  const [teamCode, setTeamCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [localError, setLocalError] = useState('');

  // Admin fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const { joinRoom, gameState, error, clearError } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (gameState) router.push('/player');
  }, [gameState, router]);

  // ── Player join ─────────────────────────────────────────────────────────────
  const handleJoin = () => {
    clearError();
    setLocalError('');
    if (!teamCode.trim()) { setLocalError('Enter a team code'); return; }
    if (!roomCode.trim()) { setLocalError('Enter a room code'); return; }
    if (!playerName.trim()) { setLocalError('Enter your name'); return; }
    joinRoom(teamCode.trim(), roomCode.trim(), playerName.trim());
  };

  // ── Admin login ─────────────────────────────────────────────────────────────
  const handleAdminLogin = async () => {
    setAdminError('');
    if (!adminUsername.trim()) { setAdminError('Enter your username'); return; }
    if (!adminPassword.trim()) { setAdminError('Enter your password'); return; }

    setAdminLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword }),
      });
      const data: { success: boolean; message?: string } = await res.json();
      if (data.success) {
        // Store a flag that the admin is authenticated for this session
        sessionStorage.setItem('adminAuthenticated', 'true');
        router.push('/admin');
      } else {
        setAdminError(data.message ?? 'Invalid credentials');
      }
    } catch {
      setAdminError('Could not reach the server. Is the backend running?');
    } finally {
      setAdminLoading(false);
    }
  };

  const displayError = error || localError;

  // ── Shared header ────────────────────────────────────────────────────────────
  const Header = () => (
    <div className="text-center space-y-1 mb-10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
        <span className="text-white text-3xl font-extrabold">M</span>
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MAFIA</h1>
      <p className="text-sm text-gray-400 font-medium">The social deduction game</p>
    </div>
  );

  // ── Role selection screen ────────────────────────────────────────────────────
  if (mode === 'SELECT_ROLE') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-1 w-full bg-primary" />
        <div className="flex-1 flex flex-col p-6 pt-12">
          <Header />

          <div className="space-y-2 mb-3">
            <p className="text-center text-sm text-gray-400 font-medium uppercase tracking-widest">
              Choose how to continue
            </p>
          </div>

          <div className="space-y-4 mt-4">
            <button
              id="btn-join-game"
              onClick={() => setMode('PLAYER')}
              className="w-full bg-primary text-white rounded-2xl p-5 text-left shadow-sm active:scale-[0.98] transition-transform"
            >
              <p className="text-lg font-extrabold tracking-tight">JOIN GAME</p>
              <p className="text-white/70 text-sm font-medium mt-0.5">I'm a Player</p>
            </button>

            <button
              id="btn-admin-login"
              onClick={() => setMode('ADMIN')}
              className="w-full bg-white border-2 border-gray-100 text-gray-900 rounded-2xl p-5 text-left shadow-sm active:scale-[0.98] transition-transform"
            >
              <p className="text-lg font-extrabold tracking-tight text-gray-800">LOGIN AS ADMIN</p>
              <p className="text-gray-400 text-sm font-medium mt-0.5">I'm an Organizer</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Player join screen ───────────────────────────────────────────────────────
  if (mode === 'PLAYER') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-1 w-full bg-primary" />
        <div className="flex-1 flex flex-col p-6 pt-12">
          <Header />

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <button
                id="btn-back-from-player"
                onClick={() => { setMode('SELECT_ROLE'); setLocalError(''); clearError(); }}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Back"
              >
                ← 
              </button>
              <h2 className="text-lg font-bold text-gray-900">Join a Game</h2>
            </div>

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
                id="input-team-code"
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
                id="input-room-code"
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
                id="input-player-name"
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

        <div className="p-6 pb-10">
          <Button id="btn-join-submit" onClick={handleJoin}>JOIN GAME</Button>
        </div>
      </div>
    );
  }

  // ── Admin login screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />
      <div className="flex-1 flex flex-col p-6 pt-12">
        <Header />

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button
              id="btn-back-from-admin"
              onClick={() => { setMode('SELECT_ROLE'); setAdminError(''); }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Back"
            >
              ←
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Login</h2>
              <p className="text-xs text-gray-400 font-medium">Organizer access only</p>
            </div>
          </div>

          {adminError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {adminError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
            <input
              id="input-admin-username"
              type="text"
              value={adminUsername}
              onChange={e => setAdminUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="admin"
              autoComplete="username"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <input
              id="input-admin-password"
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
        </div>
      </div>

      <div className="p-6 pb-10">
        <Button
          id="btn-admin-submit"
          onClick={handleAdminLogin}
          disabled={adminLoading}
        >
          {adminLoading ? 'VERIFYING...' : 'LOGIN AS ADMIN'}
        </Button>
      </div>
    </div>
  );
}
