"use client";
import { useState } from 'react';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '@/components/Button';

type Phase = 'QUESTION' | 'ANSWERED' | 'WAITING';

export function Round1Question() {
  const { gameState, submitRound1Answer } = useSocket();
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('QUESTION');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);

  if (!gameState) return null;

  const q = gameState.myRound1Question;

  const handleSubmit = () => {
    if (!selected || phase !== 'QUESTION') return;
    setSubmittedAnswer(selected);
    setPhase('ANSWERED');
    submitRound1Answer(selected);
  };

  // ── WAITING (all answered, server transitioned) ──────────────────────────
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

  // ── ANSWERED — show correct answer card ──────────────────────────────────
  if (phase === 'ANSWERED' && q) {
    const isCorrect = submittedAnswer === q.answer;
    const correctIndex = q.options.indexOf(q.answer);
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] ?? '?';

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-1 w-full bg-primary" />

        <div className="flex-1 flex flex-col p-6 pt-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              Round 1
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Answer Submitted</h1>
          </div>

          {/* Your answer */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Answer</p>
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isCorrect ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                {['A', 'B', 'C', 'D'][q.options.indexOf(submittedAnswer ?? '')] ?? '?'}
              </div>
              <span className={`font-bold text-base ${isCorrect ? 'text-green-700' : 'text-primary'}`}>{submittedAnswer}</span>
              <span className="ml-auto text-xl">{isCorrect ? '✅' : '❌'}</span>
            </div>
          </div>

          {/* Correct answer reveal */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Correct Answer</p>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {correctLetter}
              </div>
              <span className="font-extrabold text-base text-green-700">{q.answer}</span>
              <span className="ml-auto text-xl">✅</span>
            </div>
          </div>

          {/* Waiting banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center mt-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-sm font-semibold text-blue-700">
              Waiting for all players to answer...
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Discussion begins when everyone is done.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION — show the MCQ ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="mb-6 pt-4">
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Round 1
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Technical Challenge</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Select the correct answer</p>
        </div>

        {/* Question card */}
        {q ? (
          <>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">
              <p className="text-lg font-bold text-gray-900 leading-snug">{q.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 flex-1">
              {q.options.map((option, i) => {
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 font-medium">Loading question...</p>
          </div>
        )}
      </div>

      <div className="p-6 pb-10">
        <Button disabled={!selected || !q} onClick={handleSubmit}>
          SUBMIT ANSWER
        </Button>
      </div>
    </div>
  );
}
