"use client";
import { useState } from 'react';
import { useSocket } from '@/components/providers/SocketContext';
import { Button } from '../Button';

export function RoleReveal() {
  const { gameState, proceedToNight } = useSocket();
  const [revealed, setRevealed] = useState(false);

  if (!gameState) return null;

  const role = gameState.myRole;
  const isDead = gameState.myStatus === 'DEAD';
  const isMafia = role === 'MAFIA';
  const isInvestigator = role === 'INVESTIGATOR';
  const isCivilian = role === 'CIVILIAN';

  // Dead player — show their role directly (they were eliminated this round)
  if (isDead) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950">
        <div className="h-1 w-full bg-gray-700" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <p className="text-5xl mb-4">👻</p>
            <h1 className="text-3xl font-extrabold text-white">You Are Eliminated</h1>
            <p className="text-gray-400 text-sm font-medium mt-2">You can watch the rest of the game.</p>
          </div>
          <div className={`w-full max-w-xs rounded-3xl p-8 text-center border ${
            isMafia ? 'bg-red-950/50 border-red-800' :
            isInvestigator ? 'bg-amber-950/50 border-amber-800' :
            'bg-blue-950/50 border-blue-800'
          }`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Your Role Was</p>
            <div className={`inline-block px-6 py-2 rounded-full font-extrabold text-sm uppercase tracking-widest mb-4 ${
              isMafia ? 'bg-primary text-white' :
              isInvestigator ? 'bg-amber-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {role}
            </div>

          </div>
          <p className="text-gray-500 text-sm text-center">
            Roles for other players will be revealed when the game ends.
          </p>
        </div>
      </div>
    );
  }

  // Colour theme per role
  const cardBg = isMafia ? 'bg-red-50 border-red-200' : isInvestigator ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';
  const badgeBg = isMafia ? 'bg-primary text-white' : isInvestigator ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white';
  const accentColor = isMafia ? 'text-primary' : isInvestigator ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6 pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Round 1 Complete
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Your Secret Role</h1>
          <p className="text-sm text-gray-400 font-medium mt-2">
            {revealed ? 'Keep your screen hidden from others.' : 'Tap the card to reveal your role.'}
          </p>
        </div>

        {/* Role card */}
        <div className="flex-1 flex flex-col">
          {!revealed ? (
            /* Tap-to-reveal */
            <button
              onClick={() => setRevealed(true)}
              className="flex-1 bg-primary rounded-3xl flex flex-col items-center justify-center gap-5 active:scale-[0.98] transition-transform min-h-[300px] shadow-lg"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-center">
                <span className="text-white text-2xl font-extrabold tracking-wider block">TAP TO REVEAL</span>
                <span className="text-white/70 text-sm font-medium mt-1 block">Make sure no one is watching</span>
              </div>
            </button>
          ) : (
            /* Revealed role card */
            <div className={`flex-1 rounded-3xl border-2 flex flex-col items-center justify-center p-8 gap-5 min-h-[300px] shadow-sm ${cardBg}`}>
              {/* Role badge */}
              <div className={`px-7 py-2.5 rounded-full font-extrabold text-sm uppercase tracking-widest ${badgeBg}`}>
                {role ?? 'UNKNOWN'}
              </div>



              {/* Mafia partner */}
              {isMafia && gameState.myMafiaPartner && (
                <div className="w-full border-t border-red-200 pt-5 text-center">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accentColor}`}>Your Mafia Partner</p>
                  <p className="text-xl font-extrabold text-gray-900">{gameState.myMafiaPartner}</p>
                  <p className="text-xs text-gray-400 mt-1">Work together. Stay hidden.</p>
                </div>
              )}

              {/* Investigator ability */}
              {isInvestigator && (
                <div className="w-full border-t border-amber-200 pt-5 text-center">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accentColor}`}>Your Ability</p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    Each night, investigate one player. If they are Mafia, they are immediately eliminated.
                  </p>
                </div>
              )}

              {/* Civilian note */}
              {isCivilian && (
                <div className="w-full border-t border-blue-200 pt-5 text-center">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accentColor}`}>Your Goal</p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    Find and eliminate both Mafia through discussion and voting.
                  </p>
                </div>
              )}

              <button
                onClick={() => setRevealed(false)}
                className="text-sm font-semibold text-gray-400 underline underline-offset-2 mt-1"
              >
                Hide role
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pb-10">
        <p className="text-center text-xs text-gray-400 font-medium mb-4">
          {revealed
            ? 'Remember your role — Night phase begins next.'
            : 'Tap the card above to view your role.'}
        </p>
        <Button onClick={proceedToNight} disabled={!revealed}>
          {"I'M READY — PROCEED TO NIGHT"}
        </Button>
      </div>
    </div>
  );
}
