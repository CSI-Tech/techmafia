import React from 'react';
import type { GameState, RoomStatus } from '@/types';

interface StatusBadgeProps {
  status: RoomStatus | GameState;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'WAITING':
    case 'WAITING_FOR_PLAYERS':
      colorClass = 'bg-yellow-100 text-yellow-700';
      label = 'WAITING';
      break;
    case 'READY':
      colorClass = 'bg-blue-100 text-blue-700';
      break;
    case 'IN_PROGRESS':
    case 'ROLE_ASSIGNMENT':
    case 'ROUND_1_QUESTION':
    case 'ROUND_1_DISCUSSION':
    case 'ROUND_1_VOTING':
    case 'ROUND_1_RESULT':
    case 'ROLE_REVEAL':
    case 'NIGHT':
    case 'MORNING_RESULT':
    case 'ROUND_2_DISCUSSION':
    case 'ROUND_2_VOTING':
    case 'ROUND_RESULT':
      colorClass = 'bg-green-100 text-green-700';
      if (status === 'IN_PROGRESS') label = 'LIVE';
      break;
    case 'COMPLETED':
    case 'GAME_COMPLETE':
      colorClass = 'bg-primary/10 text-primary';
      label = 'COMPLETED';
      break;
  }

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${colorClass} ${className}`}>
      {label}
    </span>
  );
}
