import React from 'react';
import type { AdminPlayer } from '@/types';

interface PlayerTableProps {
  players: AdminPlayer[];
}

export function PlayerTable({ players }: PlayerTableProps) {
  if (!players || players.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        No players joined yet
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
