"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTeam } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Button } from '../Button';

interface TeamCardProps {
  team: AdminTeam;
}

export function TeamCard({ team }: TeamCardProps) {
  const router = useRouter();
  const live = team.live;
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!live?.timerEndsAt) {
      setTimeout(() => {
        setTimeLeft(null);
      }, 0);
      return;
    }
    const updateTimer = () => {
      const remaining = live.timerEndsAt! - Date.now();
      setTimeLeft(Math.max(0, remaining));
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, [live?.timerEndsAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCompleted = team.status === 'COMPLETED' || live?.currentState === 'GAME_COMPLETE';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{team.teamNumber}</h3>
          <p className="text-xs text-gray-500 font-medium">Room: {team.roomCode}</p>
        </div>
        <StatusBadge status={live ? live.currentState : team.status} />
      </div>
      
      <div className="p-6 space-y-4 flex-grow">
        {isCompleted ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Status</span>
              <span className="text-sm font-bold text-red-600">COMPLETED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Winner</span>
              <span className="text-lg font-bold text-primary">{team.winner || live?.winner || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Rounds</span>
              <span className="text-sm font-bold text-gray-900">{team.rounds || live?.currentRound || 0}</span>
            </div>
          </>
        ) : live ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Status</span>
              <span className="text-sm font-bold text-green-600">LIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Round</span>
              <span className="text-sm font-bold text-gray-900">{live.currentRound}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Stage</span>
              <span className="text-sm font-bold text-primary">{live.currentState}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Timer</span>
              <span className="text-lg font-extrabold text-primary tabular-nums">
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Players</span>
              <span className="text-sm font-bold text-gray-900">
                {live.players.length} / {live.maxPlayers || 8}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Alive</span>
              <span className="text-sm font-bold text-green-700">
                {live.aliveCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Dead</span>
              <span className="text-sm font-bold text-red-600">
                {live.players.length - live.aliveCount}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Status</span>
              <span className="text-sm font-bold text-yellow-600">WAITING</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Players</span>
              <span className="text-sm font-bold text-gray-900">
                {team.playerNames.length} / {team.maxPlayers || 8}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Created</span>
              <span className="text-sm font-bold text-gray-900">
                {new Date(team.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="p-6 pt-0 mt-auto">
        <Button 
          variant="outline" 
          fullWidth
          onClick={() => router.push(`/admin/teams/${team.teamId}`)}
        >
          VIEW DETAILS
        </Button>
      </div>
    </div>
  );
}
