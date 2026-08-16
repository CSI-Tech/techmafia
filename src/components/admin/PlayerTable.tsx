import React from 'react';
import type { AdminPlayer } from '@/types';

interface PlayerTableProps {
  players: AdminPlayer[];
  currentState?: string;
}

export function PlayerTable({ players, currentState }: PlayerTableProps) {
  if (!players || players.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        No players joined yet
      </div>
    );
  }

  const hasStarted = currentState && currentState !== 'WAITING_FOR_PLAYERS' && currentState !== 'READY';

  const renderChallengeResponse = (p: AdminPlayer, state?: string) => {
    // 1. Show Round 1 details if they exist or if in Round 1 phases
    const isRound1Phase = state?.startsWith('ROUND_1_') || p.round1Answered;
    
    if (isRound1Phase) {
      if (p.round1AnswerText) {
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900 text-sm">
              "{p.round1AnswerText}"
            </span>
            <span>
              {p.round1AnswerCorrect ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                  ✓ Correct
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                  ✗ Incorrect
                </span>
              )}
            </span>
          </div>
        );
      } else if (p.round1Answered) {
        return <span className="text-sm font-semibold text-gray-500">Submitted</span>;
      } else if (p.status === 'ALIVE') {
        return <span className="text-sm font-medium text-gray-400 italic animate-pulse">Solving...</span>;
      } else {
        return <span className="text-sm text-gray-400">-</span>;
      }
    }

    // 2. Show Night Action / Quiz details if in NIGHT phase
    if (state === 'NIGHT') {
      if (p.role === 'CIVILIAN') {
        if (p.nightQuizAnswerText) {
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900 text-sm">
                "{p.nightQuizAnswerText}"
              </span>
              <span>
                {p.nightQuizAnswerCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                    ✓ Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                    ✗ Incorrect
                  </span>
                )}
              </span>
            </div>
          );
        } else if (p.nightQuizAnswered) {
          return <span className="text-sm font-semibold text-gray-500">Submitted</span>;
        } else if (p.status === 'ALIVE') {
          return <span className="text-sm font-medium text-gray-400 italic animate-pulse">Solving Quiz...</span>;
        } else {
          return <span className="text-sm text-gray-400">-</span>;
        }
      } else if (p.role === 'MAFIA') {
        if (p.targetPlayerName) {
          return (
            <div className="text-sm">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Kill Action</span>
              <span className="font-bold text-red-700">Target: {p.targetPlayerName}</span>
            </div>
          );
        } else if (p.status === 'ALIVE') {
          return <span className="text-sm font-medium text-gray-400 italic animate-pulse">Choosing target...</span>;
        }
      } else if (p.role === 'INVESTIGATOR') {
        if (p.targetPlayerName) {
          return (
            <div className="text-sm">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Investigate Action</span>
              <span className="font-bold text-amber-700">Check: {p.targetPlayerName}</span>
            </div>
          );
        } else if (p.status === 'ALIVE') {
          return <span className="text-sm font-medium text-gray-400 italic animate-pulse">Choosing target...</span>;
        }
      }
    }

    // 3. Post-Night Morning and Round 2 phases can display night quiz response if available
    if (p.nightQuizAnswerText) {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Night Quiz Response</span>
          <span className="font-semibold text-gray-900 text-sm">
            "{p.nightQuizAnswerText}"
          </span>
          <span>
            {p.nightQuizAnswerCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                ✓ Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                ✗ Incorrect
              </span>
            )}
          </span>
        </div>
      );
    }

    return <span className="text-sm text-gray-400">-</span>;
  };

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
            {hasStarted && (
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Challenge Response / Action</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {players.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-bold text-gray-900">{p.name}</span>
              </td>
              <td className="px-6 py-4">
                {p.status === 'ALIVE' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    ALIVE
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      DEAD
                    </span>
                    {p.eliminatedRound && (
                      <span className="block text-xxs font-semibold text-gray-400 uppercase tracking-wide">
                        Eliminated: Round {p.eliminatedRound} ({p.eliminatedCause || 'UNKNOWN'})
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {p.role === 'MAFIA' ? (
                  <span className="font-bold text-primary">{p.role}</span>
                ) : p.role === 'INVESTIGATOR' ? (
                  <span className="font-bold text-amber-600">{p.role}</span>
                ) : p.role === 'CIVILIAN' ? (
                  <span className="font-bold text-blue-600">{p.role}</span>
                ) : (
                  <span className="text-gray-400 italic">Unassigned</span>
                )}
              </td>
              {hasStarted && (
                <td className="px-6 py-4">
                  {renderChallengeResponse(p, currentState)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
