"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { AdminTeam, GameLogEntry, Role, AdminPlayer } from '@/types';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PlayerTable } from '@/components/admin/PlayerTable';
import { RoundHistory } from '@/components/admin/RoundHistory';
import { Button } from '@/components/Button';
import { useAdminSocket } from '@/components/providers/AdminSocketContext';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const { liveTeams, kickPlayer } = useAdminSocket();
  const [team, setTeam] = useState<AdminTeam | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Fetch full team details
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [teamRes, logsRes] = await Promise.all([
          fetch(`/api/admin/teams/${teamId}`),
          fetch(`/api/admin/teams/${teamId}/logs`)
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
    const poll = setInterval(fetchDetail, 3000);
    return () => clearInterval(poll);
  }, [teamId]);

  // Timer logic
  useEffect(() => {
    if (!team?.live?.timerEndsAt) {
      setTimeout(() => {
        setTimeLeft(null);
      }, 0);
      return;
    }
    const updateTimer = () => {
      const remaining = team.live!.timerEndsAt! - Date.now();
      setTimeLeft(Math.max(0, remaining));
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, [team?.live?.timerEndsAt, team?.live]);

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
        <Button onClick={() => router.push('/admin/games')}>Back to Live Games</Button>
      </div>
    );
  }

  const liveUpdate = liveTeams[teamId];
  const live = liveUpdate
    ? {
        currentState: liveUpdate.currentState,
        currentRound: liveUpdate.currentRound,
        timerEndsAt: liveUpdate.timerEndsAt,
        players: liveUpdate.players,
        winner: liveUpdate.winner,
        advancingPlayers: liveUpdate.advancingPlayers,
      }
    : team.live;

  const status = liveUpdate
    ? (liveUpdate.currentState === 'GAME_COMPLETE' ? 'COMPLETED' : (liveUpdate.currentState === 'WAITING_FOR_PLAYERS' ? 'WAITING' : 'IN_PROGRESS'))
    : team.status;

  const isCompleted = status === 'COMPLETED';
  const winner = liveUpdate ? liveUpdate.winner : (team.winner || live?.winner);

  // Compute advancing player names
  const advancingNames = team.advancingPlayerNames || (live?.advancingPlayers ? live.players.filter(p => live.advancingPlayers.includes(p.id || '')).map(p => p.name) : []);

  // Compute final player outcomes
  const finalPlayers = (team.playerRoles || live?.players || []).map((p: any) => {
    const name = p.name as string;
    const role = p.role as Role;
    const isAdvanced = advancingNames.includes(name);
    return { name, role, isAdvanced };
  });

  // Compute elimination history — prefer live in-memory data (always up-to-date)
  // and fall back to the DB record only for completed games with no live state.
  const elimHistory = (live?.players
    ? live.players
        .filter((p: AdminPlayer) => p.status === 'DEAD')
        .map((p: AdminPlayer) => ({
          round: p.eliminatedRound || 1,
          playerName: p.name,
          role: p.role || 'UNKNOWN',
          cause: p.eliminatedCause || 'UNKNOWN',
        }))
        .sort((a: { round: number }, b: { round: number }) => a.round - b.round)
    : null)
    ?? (team.eliminationHistory?.length
      ? team.eliminationHistory.map((e: { round: number; playerName: string; role: string }) => ({
          ...e,
          cause: 'UNKNOWN',
        }))
      : []);

  const handleKickPlayer = (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to kick ${playerName}?`)) return;
    if (kickPlayer) {
      kickPlayer(teamId, playerId);
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action is permanent and cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/games');
      } else {
        alert(data.message || 'Failed to delete room');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting room');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <button 
            onClick={() => router.push('/admin/games')}
            className="text-sm font-bold text-gray-400 hover:text-primary transition-colors mb-2"
          >
            ← BACK TO LIVE GAMES
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-extrabold text-gray-900">{team.teamNumber}</h2>
            <StatusBadge status={live ? live.currentState : status} />
          </div>
          <p className="text-gray-500 font-medium mt-1">Room Code: <span className="font-mono font-bold text-gray-900">{team.roomCode}</span></p>
        </div>
        
        <div className="flex items-center gap-4 self-end">
          {live && !isCompleted && (
            <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 text-center min-w-[150px]">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Timer</p>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </p>
            </div>
          )}
          <Button 
            onClick={handleDeleteRoom}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3.5 rounded-xl shadow-sm border-none transition-colors"
          >
            DELETE ROOM
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Live Info, Player Monitoring, Current Stage Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Monitoring Details */}
          {live && !isCompleted && (
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Current Stage Details</h3>
              
              {/* ROUND 1 technical question details */}
              {live.currentState === 'ROUND_1_QUESTION' && (
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <p className="font-bold text-primary">ROUND 1 TECHNICAL QUESTION</p>
                  <p className="text-sm text-gray-600 mt-1">Players are answering their secret Technical Challenge.</p>
                  <div className="mt-3 flex justify-between text-xs font-semibold text-gray-500 uppercase">
                    <span>Question Stage</span>
                    <span className="text-green-600">ACTIVE</span>
                  </div>
                </div>
              )}

              {/* Discussion Details */}
              {(live.currentState === 'ROUND_1_DISCUSSION' || live.currentState === 'ROUND_2_DISCUSSION') && (
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <p className="font-bold text-primary">DISCUSSION PHASE</p>
                  <p className="text-sm text-gray-600 mt-1">Players are discussing face to face to identify the Mafia.</p>
                  <div className="mt-3 flex justify-between text-xs font-semibold text-gray-500 uppercase">
                    <span>Time Remaining</span>
                    <span className="text-primary">{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
                  </div>
                </div>
              )}

              {/* Voting Details */}
              {(live.currentState === 'ROUND_1_VOTING' || live.currentState === 'ROUND_2_VOTING') && (
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <p className="font-bold text-primary">VOTING PHASE</p>
                  <p className="text-sm text-gray-600 mt-1">Players are casting their votes on their devices.</p>
                  <div className="mt-3 flex justify-between text-xs font-semibold text-gray-500 uppercase">
                    <span>Time Remaining</span>
                    <span className="text-primary">{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
                  </div>
                </div>
              )}

              {/* Night Phase detailed monitoring */}
              {live.currentState === 'NIGHT' && (
                <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-4">
                  <p className="font-extrabold text-amber-400">NIGHT PHASE MONITORING</p>
                  
                  {/* Mafia Details */}
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Mafia Actions</span>
                    <div className="space-y-2">
                      {live.players.filter(p => p.role === 'MAFIA').map((m, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="font-medium text-slate-300">{m.name}</span>
                          <span className={m.nightActionTarget ? 'text-green-400 font-bold' : 'text-slate-500'}>
                            {m.nightActionTarget ? `Submitted (Target: ${m.targetPlayerName})` : 'Waiting'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investigator Details */}
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Investigator</span>
                    {live.players.filter(p => p.role === 'INVESTIGATOR').map((i, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="font-medium text-slate-300">{i.name}</span>
                        <span className={i.nightActionTarget ? 'text-green-400 font-bold' : 'text-slate-500'}>
                          {i.nightActionTarget ? `Submitted (Target: ${i.targetPlayerName})` : 'Waiting'}
                        </span>
                      </div>
                    ))}
                    {live.players.filter(p => p.role === 'INVESTIGATOR').length === 0 && (
                      <span className="text-sm text-slate-500 italic">Investigator eliminated</span>
                    )}
                  </div>

                  {/* Civilian Quiz Details */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Civilian Quizzes</span>
                    <div className="space-y-2">
                      {live.players.filter(p => p.role === 'CIVILIAN').map((c, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="font-medium text-slate-300">{c.name}</span>
                          <span className={c.nightQuizAnswered ? 'text-green-400 font-bold' : 'text-slate-500'}>
                            {c.nightQuizAnswered ? 'Completed' : 'Solving'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Player Monitoring Table */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Player Monitoring</h3>
            <PlayerTable 
              players={live?.players || []} 
              currentState={live?.currentState} 
              onKick={handleKickPlayer}
            />
          </section>

          {/* Elimination History */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Elimination History</h3>
            {elimHistory.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No eliminations recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {elimHistory.map((elim: { playerName: string; round: number; role: string; cause: string }, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-gray-800">{elim.playerName}</span>
                      <span className="text-xxs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full uppercase">Round {elim.round}</span>
                    </div>
                    <div className="text-xs font-bold text-primary uppercase">{elim.role}</div>
                    <div className="text-xxs font-bold text-gray-400 uppercase tracking-wider mt-2">
                      Cause: <span className="text-gray-600 font-extrabold">{elim.cause.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Advancement & Game Complete Details */}
          {isCompleted && (
            <section className="bg-red-50 rounded-2xl p-6 border border-red-100 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-primary mb-2 uppercase tracking-wide">Final Result</h3>
                <p className="text-4xl font-black text-gray-900 mb-1">{winner} WON</p>
                <p className="text-gray-600 font-medium">Game completed after {team.rounds || live?.currentRound} rounds.</p>
              </div>

              {/* Advancement list */}
              <div className="bg-white p-6 rounded-xl border border-red-150 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Players Moving Forward</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {finalPlayers.map((p: { name: string; role: Role; isAdvanced: boolean }, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center ${p.isAdvanced ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <span className="font-bold text-gray-800 text-sm block">{p.name}</span>
                        <span className="text-xxs font-bold text-gray-400 uppercase">{p.role}</span>
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${p.isAdvanced ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                        {p.isAdvanced ? 'Advanced' : 'Eliminated'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Round History & Logs */}
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
