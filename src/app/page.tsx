"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

type Mode = 'SELECT_ROLE' | 'PLAYER' | 'ADMIN';

const BACKEND_URL = '';

const mockAccounts = [
  { name: 'Alice Smith', email: 'alice.smith@gmail.com', picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice' },
  { name: 'Bob Johnson', email: 'bob.johnson@gmail.com', picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bob' },
  { name: 'Charlie Brown', email: 'charlie.brown@gmail.com', picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Charlie' },
];

const Header = () => (
  <div className="text-center space-y-1 mb-10">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
      <span className="text-white text-3xl font-extrabold">M</span>
    </div>
    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MAFIA</h1>
    <p className="text-sm text-gray-400 font-medium">The social deduction game</p>
  </div>
);

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>('SELECT_ROLE');

  // Player fields
  const [loginCode, setLoginCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [localError, setLocalError] = useState('');

  // Google OAuth fields
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [showMockModal, setShowMockModal] = useState(false);
  const [customMockName, setCustomMockName] = useState('');
  const [customMockEmail, setCustomMockEmail] = useState('');
  const [activeGame, setActiveGame] = useState<{
    teamId: string;
    roomCode: string;
    playerName: string;
  } | null>(null);
  const [checkingActiveGame, setCheckingActiveGame] = useState(false);
  const [googleLoadFailed, setGoogleLoadFailed] = useState(false);

  // Admin fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const { joinRoom, gameState, error, clearError } = useSocket();
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = !!(clientId && clientId !== 'undefined' && clientId !== 'null' && clientId.trim() !== '');

  useEffect(() => {
    if (gameState) router.push('/player');
  }, [gameState, router]);

  // Load saved Google User from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('techmafia_google_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setGoogleUser(parsed);
        setPlayerName(parsed.name);
      } catch (e) {
        localStorage.removeItem('techmafia_google_user');
      }
    }
  }, []);

  // Poll for active game whenever googleUser changes
  useEffect(() => {
    if (!googleUser) {
      setActiveGame(null);
      return;
    }

    const checkActive = async () => {
      setCheckingActiveGame(true);
      try {
        const res = await fetch(`/api/player/active-game?email=${encodeURIComponent(googleUser.email)}`);
        const data = await res.json();
        if (data.success && data.active) {
          setActiveGame({
            teamId: data.teamId,
            roomCode: data.roomCode,
            playerName: data.playerName,
          });
        } else {
          setActiveGame(null);
        }
      } catch (e) {
        console.error('Error fetching active game:', e);
      } finally {
        setCheckingActiveGame(false);
      }
    };

    checkActive();
  }, [googleUser]);

  // JWT Decoder helper
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('JWT Decode failed:', e);
      return null;
    }
  };

  const handleGoogleLoginSuccess = (response: any) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      const user = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
      };
      localStorage.setItem('techmafia_google_user', JSON.stringify(user));
      setGoogleUser(user);
      setPlayerName(user.name);
    }
  };

  // Load Google script on mount if configured
  useEffect(() => {
    if (!isGoogleConfigured) return;

    // Avoid loading duplicate scripts
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [isGoogleConfigured]);

  // Render Google Sign-in button when PLAYER mode is active and DOM elements are mounted
  useEffect(() => {
    if (!isGoogleConfigured || mode !== 'PLAYER' || googleUser) return;

    const renderGoogleButton = () => {
      const btnElement = document.getElementById('google-signin-btn');
      if (btnElement && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLoginSuccess,
          });
          (window as any).google.accounts.id.renderButton(
            btnElement,
            { theme: 'outline', size: 'large', width: '100%' }
          );
        } catch (e) {
          console.error('Error rendering Google button:', e);
          setGoogleLoadFailed(true);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      renderGoogleButton();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.id) {
          renderGoogleButton();
          clearInterval(interval);
        } else if (attempts > 30) { // 3 seconds timeout
          setGoogleLoadFailed(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGoogleConfigured, mode, googleUser, clientId]);

  const handleMockLogin = (account: { name: string; email: string; picture?: string }) => {
    const user = {
      name: account.name,
      email: account.email,
      picture: account.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${account.name}`,
      provider: 'mock',
    };
    localStorage.setItem('techmafia_google_user', JSON.stringify(user));
    setGoogleUser(user);
    setPlayerName(user.name);
    setShowMockModal(false);
  };

  const handleCustomMockSubmit = () => {
    if (!customMockName.trim() || !customMockEmail.trim()) return;
    handleMockLogin({
      name: customMockName.trim(),
      email: customMockEmail.trim(),
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('techmafia_google_user');
    setGoogleUser(null);
    setPlayerName('');
    setActiveGame(null);
  };

  // ── Player join ─────────────────────────────────────────────────────────────
  const handleJoin = () => {
    clearError();
    setLocalError('');
    if (!loginCode.trim()) { setLocalError('Enter your login code'); return; }
    if (!playerName.trim()) { setLocalError('Please authenticate with Google first'); return; }
    joinRoom(loginCode.trim(), playerName.trim(), googleUser?.email);
  };

  const handleResumeGame = () => {
    if (!activeGame) return;
    joinRoom(activeGame.roomCode, activeGame.playerName, googleUser?.email);
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
              className="w-full bg-primary text-white rounded-2xl p-5 text-left shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <p className="text-lg font-extrabold tracking-tight">JOIN GAME</p>
              <p className="text-white/70 text-sm font-medium mt-0.5">I&apos;m a Player</p>
            </button>

            <button
              id="btn-admin-login"
              onClick={() => setMode('ADMIN')}
              className="w-full bg-white border-2 border-gray-100 text-gray-900 rounded-2xl p-5 text-left shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <p className="text-lg font-extrabold tracking-tight text-gray-800">LOGIN AS ADMIN</p>
              <p className="text-gray-400 text-sm font-medium mt-0.5">I&apos;m an Organizer</p>
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
        <div className="flex-1 flex flex-col p-6 pt-8">
          <Header />

          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/20 p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <button
                id="btn-back-from-player"
                onClick={() => { setMode('SELECT_ROLE'); setLocalError(''); clearError(); }}
                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-lg font-bold"
                aria-label="Back"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-gray-900">Join a Game</h2>
            </div>

            {googleUser ? (
              /* Signed In Flow */
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-inner animate-fadeIn">
                  {googleUser.picture && (
                    <img src={googleUser.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-300 bg-white" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Account</p>
                    <p className="font-extrabold text-sm text-gray-900 truncate">{googleUser.name}</p>
                    <p className="text-xxs font-semibold text-gray-400 truncate">{googleUser.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors border border-red-100 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Resume Active Game Alert */}
                {activeGame && (
                  <div className="bg-red-50 border border-red-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3 animate-fadeIn">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-primary uppercase tracking-wide">
                          Active Game Found
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">Resume Your Game</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          You have an active session in Room <span className="font-extrabold text-primary">{activeGame.roomCode}</span>.
                        </p>
                      </div>
                      <span className="text-3xl">🎮</span>
                    </div>
                    <button
                      id="btn-resume-game"
                      onClick={handleResumeGame}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-3 px-4 font-bold text-sm tracking-wide shadow-sm active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      RESUME GAME AS {activeGame.playerName.toUpperCase()}
                    </button>
                  </div>
                )}

                {displayError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 rounded-xl animate-fadeIn">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {displayError}
                  </div>
                )}

                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">LOGIN CODE</label>
                    <input
                      id="input-login-code"
                      type="text"
                      value={loginCode}
                      onChange={e => setLoginCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="ABC123"
                      maxLength={12}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center tracking-widest focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">PLAYER NAME / USERNAME</label>
                    <input
                      id="input-player-name"
                      type="text"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="Enter your in-game name"
                      maxLength={20}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-center focus:outline-none focus:border-primary focus:bg-white transition-colors placeholder:text-gray-300 placeholder:font-normal"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Signed Out Flow - Ask for Google auth ONLY */
              <div className="space-y-4 text-center py-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Google Authentication Required</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Please log in with your Google account to join game rooms and enable session recovery.
                </p>

                <div className="pt-4 max-w-xs mx-auto">
                  {isGoogleConfigured && !googleLoadFailed ? (
                    <div id="google-signin-btn" className="w-full min-h-[44px]" />
                  ) : (
                    <div className="space-y-3 w-full">
                      {googleLoadFailed && isGoogleConfigured && (
                        <p className="text-xs text-amber-600 font-bold mb-2">
                          ⚠️ Google Sign-In could not load. Running in Local Sandbox fallback.
                        </p>
                      )}
                      <button
                        onClick={() => setShowMockModal(true)}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl py-3 px-4 shadow-sm font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                          <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.97 -3.3,0.97c-2.34,0 -4.33,-1.58 -5.04,-3.7H2.88v2.66C4.38,18.73 7.97,20.62 12,20.62z" fill="#34A853" />
                          <path d="M6.96,13.21C6.78,12.7 6.69,12.16 6.69,11.6c0,-0.56 0.09,-1.1 0.27,-1.61V7.33H2.88C2.28,8.53 1.95,9.9 1.95,11.6c0,1.7 0.33,3.07 0.93,4.27L6.96,13.21z" fill="#FBBC05" />
                          <path d="M12,5.2c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.5 14.43,1.7 12,1.7C7.97,1.7 4.38,3.58 2.88,6.67L6.96,9.33C7.67,7.21 9.66,5.2 12,5.2z" fill="#EA4335" />
                        </svg>
                        <span>Sign in with Google</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {googleUser && (
          <div className="p-6 pb-10">
            <Button id="btn-join-submit" onClick={handleJoin}>JOIN GAME</Button>
          </div>
        )}

        {/* Sandbox Mock Login Modal */}
        {showMockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 transition-opacity">
            <div className="bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 relative animate-fadeIn">
              <div>
                <h3 className="text-lg font-black text-gray-900">Google OAuth Sandbox</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">Select a mock account to test Google Sign-in and session recovery.</p>
              </div>

              <div className="space-y-3">
                {mockAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMockLogin(acc)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-primary/50 transition-all text-left bg-gray-50/50 hover:bg-red-50/10 cursor-pointer"
                  >
                    <img src={acc.picture} alt={acc.name} className="w-9 h-9 rounded-full border border-gray-200 bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{acc.name}</p>
                      <p className="text-xxs text-gray-400 font-semibold truncate">{acc.email}</p>
                    </div>
                    <span className="text-xs font-bold text-primary/70 uppercase">Select</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <span className="text-xxs font-bold text-gray-400 uppercase tracking-widest text-center">Or Create Custom Mock Account</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Custom Name"
                    value={customMockName}
                    onChange={e => setCustomMockName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    placeholder="custom.email@gmail.com"
                    value={customMockEmail}
                    onChange={e => setCustomMockEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleCustomMockSubmit}
                    disabled={!customMockName.trim() || !customMockEmail.trim()}
                    className="w-full bg-gray-800 text-white rounded-xl py-2 px-3 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Create & Sign In
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowMockModal(false)}
                className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Admin login screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />
      <div className="flex-1 flex flex-col p-6 pt-12">
        <Header />

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/20 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button
              id="btn-back-from-admin"
              onClick={() => { setMode('SELECT_ROLE'); setAdminError(''); }}
              className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-lg font-bold"
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email / Username</label>
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
          {adminLoading ? 'VERIFYING...' : 'LOGIN'}
        </Button>
      </div>
    </div>
  );
}
