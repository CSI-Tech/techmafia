"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { AdminTeam, GameLogEntry } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PlayerTable } from '@/components/admin/PlayerTable';
import { RoundHistory } from '@/components/admin/RoundHistory';
import { Button } from '@/components/Button';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<AdminTeam | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Fetch full team details
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [teamRes, logsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/admin/teams/${teamId}`, { headers: { 'x-admin-auth': 'true' } }),
          fetch(`http://localhost:3001/api/admin/teams/${teamId}/logs`, { headers: { 'x-admin-auth': 'true' } })
        ]);
        
        const teamData = await teamRes.json();
        const logsData = await logsRes.json();
        
        if (teamData.success) setTeam(teamData.team);
        if (logsData.success) setLogs(logsData.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetail();
    // In a full implementation, you'd wire this to the specific socket events for updates, 
    // or poll. For MVP, we'll poll every 3s to keep the view fresh if it's active.
    const poll = setInterval(fetchDetail, 3000);
    return () => clearInterval(poll);
  }, [teamId]);

  // Timer logic
  useEffect(() => {
    if (!team?.live?.timerEndsAt) {
      setTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      const remaining = team.live!.timerEndsAt! - Date.now();
      setTimeLeft(Math.max(0, remaining));
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, [team?.live?.timerEndsAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-10 font-bold text-gray-500">Loading...</div>;
  }
  if (!team) {
    return (
      <div className="p-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Team not found</h2>
        <Button onClick={() => router.push('/admin/live')}>Back to Live Games</Button>
      </div>
    );
  }

  const live = team.live;
  const isCompleted = team.status === 'COMPLETED' || live?.currentState === 'GAME_COMPLETE';

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <button 
            onClick={() => router.push('/admin/live')}
            className="text-sm font-bold text-gray-400 hover:text-primary transition-colors mb-2"
          >
            ← BACK
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-extrabold text-gray-900">{team.teamNumber}</h2>
            <StatusBadge status={live ? live.currentState : team.status} />
          </div>
          <p className="text-gray-500 font-medium mt-1">Room Code: <span className="font-mono font-bold text-gray-900">{team.roomCode}</span></p>
        </div>
        
        {live && !isCompleted && (
          <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 text-center min-w-[150px]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Timer</p>
            <p className="text-3xl font-bold text-primary tabular-nums">
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Players */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Players</h3>
            <PlayerTable 
              players={live?.players || []} 
              showWords={true}
            />
          </section>

          {isCompleted && team.winner && (
            <section className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <h3 className="text-lg font-bold text-primary mb-2 uppercase tracking-wide">Final Result</h3>
              <p className="text-4xl font-black text-gray-900 mb-2">{team.winner} WON</p>
              <p className="text-gray-600 font-medium">Game completed after {team.rounds} rounds.</p>
            </section>
          )}
        </div>

        {/* Right Column: Round History */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Round History</h3>
            <RoundHistory logs={logs} currentRound={live?.currentRound || 0} />
          </section>
        </div>
        
      </div>
    </div>
  );
}
