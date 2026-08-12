"use client";
import React from 'react';
import { useAdminSocket } from '@/components/providers/AdminSocketContext';
import { TeamCard } from '@/components/admin/TeamCard';

export default function LiveGames() {
  const { teams } = useAdminSocket();
  
  // Only show games that are WAITING, READY, or IN_PROGRESS
  const liveGames = teams.filter(t => t.status !== 'COMPLETED');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Live Games</h2>
            <p className="text-gray-500 font-medium mt-1">Monitor all active sessions</p>
          </div>
          <div className="text-sm font-bold text-gray-400 bg-white px-4 py-2 rounded-lg border border-gray-200">
            {liveGames.length} ACTIVE
          </div>
        </div>
        
        {liveGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {liveGames.map((team) => (
              <TeamCard key={team.teamId} team={team} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Games</h3>
            <p className="text-gray-500 font-medium">Generate a new team to start playing.</p>
          </div>
        )}
      </section>
    </div>
  );
}
