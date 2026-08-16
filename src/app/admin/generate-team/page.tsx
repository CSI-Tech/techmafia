"use client";
import React, { useState } from 'react';
import { useAdminSocket } from '@/components/providers/AdminSocketContext';
import { Button } from '@/components/Button';

export default function GenerateTeam() {
  const { refreshTeams, liveTeams, teams } = useAdminSocket();
  const [teamNumber, setTeamNumber] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ teamId: string; roomCode: string; error?: string } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNumber.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/teams/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamNumber, maxPlayers })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({ teamId: data.teamId, roomCode: data.roomCode });
        setTeamNumber('');
        await refreshTeams(); // refresh list in context
      } else {
        setResult({ teamId: '', roomCode: '', error: data.message || 'Failed to generate team' });
      }
    } catch (err) {
      setResult({ teamId: '', roomCode: '', error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const getLiveStats = () => {
    if (!result || !result.teamId) return { count: 0, maxPlayers: 8, status: 'WAITING' };
    const liveTeam = liveTeams[result.teamId];
    const dbTeam = teams.find(t => t.teamId === result.teamId);
    return {
      count: liveTeam ? liveTeam.players.length : (dbTeam ? dbTeam.playerNames.length : 0),
      maxPlayers: liveTeam ? (liveTeam.maxPlayers || 8) : (dbTeam ? (dbTeam.maxPlayers || 8) : 8),
      status: liveTeam ? liveTeam.currentState : (dbTeam ? dbTeam.status : 'WAITING')
    };
  };

  const stats = getLiveStats();

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10">
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Generate Team</h2>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <form onSubmit={handleGenerate} className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Team Number / Name
              </label>
              <input
                type="text"
                required
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                placeholder="e.g. Team05"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Number of Players
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
              >
                <option value={6}>6 Players</option>
                <option value={7}>7 Players</option>
                <option value={8}>8 Players</option>
              </select>
            </div>
            
            <Button 
              type="submit" 
              fullWidth 
              disabled={loading || !teamNumber.trim()}
            >
              {loading ? 'GENERATING...' : 'GENERATE CODE'}
            </Button>
          </form>

          {result && !result.error && (
            <div className="mt-10 p-6 bg-red-50 rounded-xl border border-red-100 animate-fade-in text-center">
              <h3 className="text-xl font-bold text-primary mb-2">{result.teamId}</h3>
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Login Code</p>
              
              <div className="bg-white border-2 border-primary rounded-xl py-4 px-8 inline-block mb-6 shadow-sm">
                <span className="text-4xl font-black text-gray-900 tracking-[0.2em] font-mono">
                  {result.roomCode}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 font-medium mb-6">
                {"Give this Login Code to the players."}
              </p>

              <div className="flex justify-center gap-8 mb-6 bg-white p-4 rounded-xl border border-gray-150 w-fit mx-auto px-8 text-left">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Players</span>
                  <span className="text-lg font-extrabold text-gray-800">{stats.count} / {stats.maxPlayers}</span>
                </div>
                <div className="border-l border-gray-200" />
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                  <span className="text-lg font-extrabold text-primary uppercase whitespace-nowrap">{stats.status}</span>
                </div>
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg font-bold text-sm text-center">
              {result.error}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
