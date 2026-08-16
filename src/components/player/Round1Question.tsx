"use client";
import { useState, useEffect } from 'react';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

type Phase = 'QUESTION' | 'ANSWERED' | 'WAITING';

export function Round1Question() {
  const { gameState, submitRound1Answer } = useSocket();
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('QUESTION');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('02:00');

  useEffect(() => {
    if (!gameState?.timerEndsAt) return;
    const updateTimer = () => {
      const remainingMs = Math.max(0, gameState.timerEndsAt! - Date.now());
      const seconds = Math.floor(remainingMs / 1000);
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setTimeLeft(`${m}:${s}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState?.timerEndsAt]);

  if (!gameState) return null;

  const q = gameState.myRound1Question;
  const isTypeAnswer = q?.type === 'TYPE_ANSWER' || !q?.options || q.options.length === 0;

  const handleSubmit = () => {
    const finalAnswer = isTypeAnswer ? typedAnswer.trim() : selected;
    if (!finalAnswer || phase !== 'QUESTION') return;
    setSubmittedAnswer(finalAnswer);
    setPhase('ANSWERED');
    submitRound1Answer(finalAnswer);
  };

  // ── WAITING (no question loaded yet) ──────────────────────────────────────
  if (!q && phase !== 'ANSWERED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-gray-900">Loading Question...</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Please wait</p>
        </div>
      </div>
    );
  }

  // ── ANSWERED — show submitted confirmation with timer ────
  if (phase === 'ANSWERED' && q) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-1 w-full bg-primary" />

        <div className="flex-1 flex flex-col p-6 pt-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 1
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">ANSWER SUBMITTED</h1>
            <div className="mt-3 inline-block bg-gray-100 border border-gray-200 rounded-2xl px-6 py-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">TIME REMAINING</span>
              <span className="text-3xl font-black text-gray-800 font-mono tracking-wider">{timeLeft}</span>
            </div>
          </div>

          {/* Your submitted selection */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">YOUR SUBMITTED RESPONSE</p>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-lg text-gray-900">
              {submittedAnswer}
            </div>
          </div>

          {/* Waiting banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center mt-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-base font-bold text-blue-900">
              ANSWER SUBMITTED
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Discussion phase will start automatically when the timer finishes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION — show Technical Question ──────────────────────────────────
  const canSubmit = isTypeAnswer ? typedAnswer.trim().length > 0 : Boolean(selected);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6">
        {/* Header & Timer */}
        <div className="mb-6 pt-4 flex items-start justify-between">
          <div>
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 1
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">TECHNICAL QUESTION</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {isTypeAnswer ? 'Type your answer below' : 'Select your answer'}
            </p>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2 text-center shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">TIMER</span>
            <span className="text-xl font-black text-gray-800 font-mono">{timeLeft}</span>
          </div>
        </div>

        {/* Question card */}
        {q ? (
          <>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">
              <p className="text-lg font-bold text-gray-900 leading-snug">{q.question}</p>
            </div>

            {/* Type Answer Input OR Multiple Choice Options */}
            {isTypeAnswer ? (
              <div className="space-y-3 flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Type Your Answer
                </label>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) handleSubmit();
                  }}
                  placeholder="Type your answer here..."
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl px-5 py-4 text-lg font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {q.options?.map((option, i) => {
                  const letter = ['A', 'B', 'C', 'D'][i];
                  const isSelected = selected === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setSelected(option)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 text-left active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-red-50'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {letter}
                      </div>
                      <span className={`font-semibold text-base ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <svg className="ml-auto w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 font-medium">Loading question...</p>
          </div>
        )}
      </div>

      <div className="p-6 pb-10">
        <Button disabled={!canSubmit || !q} onClick={handleSubmit}>
          SUBMIT ANSWER
        </Button>
      </div>
    </div>
  );
}
