"use client";
import { useState } from 'react';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

// ── Dead / Spectator banner ──────────────────────────────────────────────────
function SpectatorScreen({ role }: { role: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 gap-6">
      <div className="text-center">
        <p className="text-5xl mb-4">👻</p>
        <h1 className="text-2xl font-extrabold text-white">You Are Eliminated</h1>
        <p className="text-gray-400 text-sm font-medium mt-2">Night phase is in progress.</p>
        <p className="text-gray-500 text-sm mt-1">Watch quietly as the game continues.</p>
      </div>
      {role && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl px-6 py-4 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Your Role Was</p>
          <p className={`text-xl font-extrabold ${role === 'MAFIA' ? 'text-primary' : role === 'INVESTIGATOR' ? 'text-amber-400' : 'text-blue-400'}`}>
            {role}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Submitted screen ─────────────────────────────────────────────────────────
function SubmittedScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 gap-6">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 text-center max-w-xs w-full">
        <div className="w-16 h-16 rounded-full bg-green-900/50 border border-green-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-bold text-lg mb-2">Action Submitted</p>
        <p className="text-slate-400 text-sm mb-4">{message}</p>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
        <p className="text-slate-500 text-xs mt-3">Waiting for others to finish...</p>
      </div>
    </div>
  );
}

// ── Main NightPhase ──────────────────────────────────────────────────────────
export function NightPhase() {
  const { gameState, submitNightAction, submitNightQuiz } = useSocket();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  if (!gameState) return null;

  const role = gameState.myRole;
  const isDead = gameState.myStatus === 'DEAD';
  const quiz = gameState.myNightQuiz;

  // Dead player spectator
  if (isDead) {
    return <SpectatorScreen role={role} />;
  }

  // Submitted waiting screen
  if (submitted) {
    return <SubmittedScreen message={
      role === 'MAFIA' ? 'Your target has been chosen.'
      : role === 'INVESTIGATOR' ? 'Your investigation is underway.'
      : 'Quiz complete!'
    } />;
  }

  const alivePlayers = gameState.players.filter(
    p => p.status === 'ALIVE' && p.id !== gameState.myId
  );

  // ── MAFIA ────────────────────────────────────────────────────────────────
  if (role === 'MAFIA') {
    const isMyTurn = gameState.isMyMafiaKillTurn;
    if (!isMyTurn) {
      const partnerName = gameState.myMafiaPartner || 'your partner';
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 gap-6">
          <div className="text-center">
            <p className="text-5xl mb-4">💤</p>
            <div className="inline-block px-4 py-1 bg-red-900/50 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              Night Phase · Mafia
            </div>
            <h1 className="text-2xl font-extrabold text-white">Sleeping...</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">
              It is <span className="text-primary font-bold">{partnerName}</span>'s turn to choose the kill target tonight.
            </p>
            <p className="text-slate-500 text-xs mt-3">Waiting for the action to complete...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <div className="h-1 w-full bg-primary" />
        <div className="flex-1 flex flex-col p-6">
          <div className="text-center mb-6 pt-4">
            <p className="text-4xl mb-3">🌙</p>
            <div className="inline-block px-4 py-1 bg-red-900/50 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              Night Phase · Mafia (Active)
            </div>
            <h1 className="text-2xl font-extrabold text-white">Choose Your Target</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Select one player to eliminate tonight.</p>
          </div>

          {gameState.myMafiaPartner && (
            <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-3 mb-4 text-center">
              <p className="text-slate-400 text-xs font-semibold">Your Mafia partner: <span className="text-primary font-bold">{gameState.myMafiaPartner}</span></p>
            </div>
          )}

          <div className="space-y-3 flex-1">
            {alivePlayers
              .filter(p => p.name !== gameState.myMafiaPartner)
              .map(p => {
              const isSelected = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    isSelected ? 'border-primary bg-red-950/40' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                    isSelected ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className={`font-semibold text-base flex-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 pb-10">
          <Button
            disabled={!selectedTarget}
            onClick={() => {
              if (!selectedTarget) return;
              submitNightAction(selectedTarget);
              setSubmitted(true);
            }}
          >
            CONFIRM TARGET
          </Button>
        </div>
      </div>
    );
  }

  // ── INVESTIGATOR ──────────────────────────────────────────────────────────
  if (role === 'INVESTIGATOR') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <div className="h-1 w-full bg-amber-500" />
        <div className="flex-1 flex flex-col p-6">
          <div className="text-center mb-6 pt-4">
            <p className="text-4xl mb-3">🔍</p>
            <div className="inline-block px-4 py-1 bg-amber-900/50 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              Night Phase · Investigator
            </div>
            <h1 className="text-2xl font-extrabold text-white">Investigate a Player</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">If your target is Mafia, they will be eliminated.</p>
          </div>

          <div className="space-y-3 flex-1">
            {alivePlayers.map(p => {
              const isSelected = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    isSelected ? 'border-amber-500 bg-amber-950/30' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                    isSelected ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className={`font-semibold text-base flex-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 pb-10">
          <Button
            disabled={!selectedTarget}
            onClick={() => {
              if (!selectedTarget) return;
              submitNightAction(selectedTarget);
              setSubmitted(true);
            }}
          >
            INVESTIGATE
          </Button>
        </div>
      </div>
    );
  }

  // ── CIVILIAN ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <div className="h-1 w-full bg-blue-500" />
      <div className="flex-1 flex flex-col p-6">
        <div className="text-center mb-6 pt-4">
          <p className="text-4xl mb-3">🌙</p>
          <div className="inline-block px-4 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Night Phase · Civilian
          </div>
          <h1 className="text-2xl font-extrabold text-white">Night Quiz</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Answer the question while others act.</p>
        </div>

        {quiz ? (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 mb-5">
              <p className="text-white font-bold text-base leading-snug">{quiz.question}</p>
            </div>
            <div className="space-y-3 flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Type Your Answer
              </label>
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedAnswer.trim()) {
                    submitNightQuiz(selectedAnswer.trim());
                    setSubmitted(true);
                  }
                }}
                placeholder="Type your answer here..."
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                autoFocus
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 font-medium">Loading quiz...</p>
          </div>
        )}
      </div>

      <div className="p-6 pb-10">
        <Button
          disabled={!selectedAnswer.trim() || !quiz}
          onClick={() => {
            if (!selectedAnswer.trim()) return;
            submitNightQuiz(selectedAnswer.trim());
            setSubmitted(true);
          }}
        >
          SUBMIT ANSWER
        </Button>
      </div>
    </div>
  );
}
