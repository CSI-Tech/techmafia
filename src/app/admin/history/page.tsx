"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTeam } from '@/types';
import { Button } from '@/components/Button';


export default function GameHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/admin/history');
        const data = await res.json();
        if (data.success) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Game History</h2>
            <p className="text-gray-500 font-medium mt-1">Review completed games</p>
          </div>
        </div>
        
        {loading ? (
          <div className="p-10 text-center font-bold text-gray-500">Loading history...</div>
        ) : history.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Completed At</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rounds</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Players</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((team) => (
                  <tr key={team.teamId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{team.teamNumber}</div>
                      <div className="text-xs text-gray-500 font-mono">{team.roomCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      {team.completedAt ? new Date(team.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {team.winner === 'CIVILIANS' ? (
                        <span className="font-bold text-blue-600">CIVILIANS</span>
                      ) : team.winner === 'MAFIA' ? (
                        <span className="font-bold text-primary">MAFIA</span>
                      ) : (
                        <span className="font-medium text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {team.rounds}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {team.playerNames.length}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push(`/admin/teams/${team.teamId}`)}
                      >
                        VIEW
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No History</h3>
            <p className="text-gray-500 font-medium">Completed games will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
