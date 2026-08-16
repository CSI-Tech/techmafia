"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketContext';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { WaitingRoom } from '@/components/player/WaitingRoom';
import { Round1Question } from '@/components/player/Round1Question';
import { Discussion } from '@/components/player/Discussion';
import { Voting } from '@/components/player/Voting';
import { VoteResult } from '@/components/player/VoteResult';
import { RoleReveal } from '@/components/player/RoleReveal';
import { NightPhase } from '@/components/player/NightPhase';
import { MorningResult } from '@/components/player/MorningResult';
import { GameResult } from '@/components/player/GameResult';

/**
 * Player Portal — State Machine Router
 *
 * WAITING_FOR_PLAYERS / READY → WaitingRoom
 * ROUND_1_QUESTION             → Round1Question  (tech MCQ, no role shown)
 * ROUND_1_DISCUSSION           → Discussion
 * ROUND_1_VOTING               → Voting
 * ROUND_1_RESULT               → VoteResult      (elimination + role revealed publicly)
 * ROLE_REVEAL                  → RoleReveal      (FIRST time player sees own role)
 * NIGHT                        → NightPhase      (Mafia kill / Investigator / Civilian quiz)
 * MORNING_RESULT               → MorningResult   (public night events)
 * ROUND_2_DISCUSSION           → Discussion
 * ROUND_2_VOTING               → Voting
 * ROUND_RESULT                 → VoteResult
 * GAME_COMPLETE                → GameResult
 */
export default function PlayerPortal() {
  const { gameState, connected, error } = useSocket();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const playerName = sessionStorage.getItem('techmafia_playerName');
    const teamId = sessionStorage.getItem('techmafia_teamId');
    if (!gameState && (!playerName || !teamId)) {
      router.replace('/');
    }
  }, [gameState, router, mounted]);

  if (!mounted || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center text-gray-400 max-w-xs w-full">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          </div>
          <p className="font-semibold text-gray-600">{!mounted ? "Loading..." : "Connecting..."}</p>
          <p className="text-sm mt-1">{!mounted ? "Initializing..." : "Establishing connection to the game room"}</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  router.replace('/');
                }}
                className="mt-2 text-xs font-bold text-red-700 underline"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (gameState.currentState) {
      // ── Phase 2: Waiting Room ──────────────────────────────────────────
      case 'WAITING_FOR_PLAYERS':
      case 'READY':
        return <WaitingRoom />;

      // ── Phase 4: Round 1 Technical Question ───────────────────────────
      case 'ROUND_1_QUESTION':
        return <Round1Question />;

      // ── Phase 6: Round 1 Discussion ───────────────────────────────────
      case 'ROUND_1_DISCUSSION':
        return <Discussion />;

      // ── Phase 7: Round 1 Voting ───────────────────────────────────────
      case 'ROUND_1_VOTING':
        return <Voting />;

      // ── Phase 8/9: Round 1 Vote Result + Elimination ──────────────────
      case 'ROUND_1_RESULT':
        return <VoteResult />;

      // ── Phase 10: Role Reveal (first time player sees their role) ─────
      case 'ROLE_REVEAL':
        if (!gameState.myRole) {
          return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
              <div className="text-center text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                </div>
                <p className="font-semibold text-gray-600">Loading Role...</p>
                <p className="text-sm mt-1">Please wait...</p>
              </div>
            </div>
          );
        }
        return <RoleReveal />;

      // ── Phase 11: Night ───────────────────────────────────────────────
      case 'NIGHT':
        return <NightPhase />;

      // ── Phase 13: Morning ─────────────────────────────────────────────
      case 'MORNING_RESULT':
        return <MorningResult />;

      // ── Phase 15: Round 2+ Discussion ────────────────────────────────
      case 'ROUND_2_DISCUSSION':
        return <Discussion />;

      // ── Phase 15: Round 2+ Voting ─────────────────────────────────────
      case 'ROUND_2_VOTING':
        return <Voting />;

      // ── Phase 15: Round 2+ Vote Result + Elimination ─────────────────
      case 'ROUND_RESULT':
        return <VoteResult />;

      // ── Phase 16: Game Complete ───────────────────────────────────────
      case 'GAME_COMPLETE':
        return <GameResult />;

      // ── Fallback ──────────────────────────────────────────────────────
      default:
        return (
          <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="text-center text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              </div>
              <p className="font-semibold text-gray-600">{gameState.currentState}</p>
              <p className="text-sm mt-1">Please wait...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen">
      <ConnectionBanner connected={connected} />
      {renderScreen()}
    </div>
  );
}
