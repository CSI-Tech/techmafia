"use client";
import React from 'react';
import { useAdminSocket } from '@/components/providers/AdminSocketContext';
import { TeamCard } from '@/components/admin/TeamCard';

export default function AdminDashboard() {
  const { teams } = useAdminSocket();

  // Calculate summary metrics
  const activeTeams = teams.filter(t => t.status !== 'COMPLETED').length;
  const waitingTeams = teams.filter(t => t.status === 'WAITING' || t.status === 'READY').length;
  const inProgressTeams = teams.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTeams = teams.filter(t => t.status === 'COMPLETED').length;

  const liveGames = teams.filter(t => t.status === 'IN_PROGRESS' || t.live?.currentState === 'GAME_COMPLETE').slice(0, 3); // top 3 live/just completed

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      
      {/* Summary Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 mb-2">ACTIVE TEAMS</div>
            <div className="text-4xl font-bold text-gray-900">{activeTeams}</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 mb-2">WAITING</div>
            <div className="text-4xl font-bold text-yellow-600">{waitingTeams}</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 mb-2">IN PROGRESS</div>
            <div className="text-4xl font-bold text-green-600">{inProgressTeams}</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 mb-2">COMPLETED</div>
            <div className="text-4xl font-bold text-primary">{completedTeams}</div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-gray-900">Live Preview</h3>
        </div>
        
        {liveGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveGames.map((team) => (
              <TeamCard key={team.teamId} team={team} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No live games at the moment
          </div>
        )}
      </section>
      
    </div>
  );
}
