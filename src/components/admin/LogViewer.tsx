import React from 'react';
import type { GameLogEntry } from '@/types';

interface LogViewerProps {
  logs: GameLogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        No logs found
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Team</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Round</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-6 py-3 font-bold text-gray-900 whitespace-nowrap">
                  {log.teamId} <span className="font-normal text-gray-400">({log.roomCode})</span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  {log.round > 0 ? log.round : '-'}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {log.event}
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {log.detail || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
