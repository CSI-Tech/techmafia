import React from 'react';
import type { GameLogEntry } from '@/types';

interface RoundHistoryProps {
  logs: GameLogEntry[];
  currentRound: number;
}

export function RoundHistory({ logs, currentRound }: RoundHistoryProps) {
  // Group logs by round
  const roundMap: Record<number, GameLogEntry[]> = {};
  
  logs.forEach(log => {
    if (log.round === 0) return; // ignore system/join events
    if (!roundMap[log.round]) roundMap[log.round] = [];
    roundMap[log.round].push(log);
  });

  const rounds = Object.keys(roundMap).map(Number).sort((a, b) => b - a); // newest first

  if (rounds.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        No round history yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map(roundNum => {
        const roundLogs = roundMap[roundNum];
        
        // Try to find elimination event
        const elimLog = roundLogs.find(l => l.event.includes('eliminated'));
        const tiedLog = roundLogs.find(l => l.event.includes('Vote tied'));
        
        return (
          <div key={roundNum} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h4 className="font-bold text-gray-900">ROUND {roundNum}</h4>
              {roundNum === currentRound && (
                <span className="text-xs font-bold text-primary px-2 py-1 bg-red-50 rounded-full">
                  IN PROGRESS
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex flex-col gap-2">
                {roundLogs.map((log) => (
                  <div key={log._id} className="text-sm">
                    <span className="text-gray-400 w-16 inline-block font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="font-medium text-gray-800 ml-2">{log.event}</span>
                    {log.detail && (
                      <span className="text-gray-500 ml-2 text-xs">({log.detail})</span>
                    )}
                  </div>
                ))}
              </div>

              {(elimLog || tiedLog) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase">Round Result</span>
                  {elimLog ? (
                    <div className="mt-1 font-bold text-red-600">
                      {elimLog.event} {elimLog.detail && <span className="font-medium text-gray-500 ml-1">({elimLog.detail})</span>}
                    </div>
                  ) : (
                    <div className="mt-1 font-bold text-gray-600">
                      {tiedLog?.event}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
