"use client";
import React, { useEffect, useState } from 'react';
import type { GameLogEntry } from '@/types';
import { LogViewer } from '@/components/admin/LogViewer';
import { Button } from '@/components/Button';

export default function GameLogs() {
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teamIdFilter, setTeamIdFilter] = useState('');
  const [roomCodeFilter, setRoomCodeFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (teamIdFilter) query.append('teamId', teamIdFilter);
      if (roomCodeFilter) query.append('roomCode', roomCodeFilter);
      if (roundFilter) query.append('round', roundFilter);
      if (stageFilter) query.append('stage', stageFilter);
      if (eventFilter) query.append('event', eventFilter);
      if (playerFilter) query.append('player', playerFilter);
      if (dateFilter) query.append('date', dateFilter);

      const res = await fetch(`/api/admin/logs?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchLogs();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleClear = () => {
    setTeamIdFilter('');
    setRoomCodeFilter('');
    setRoundFilter('');
    setStageFilter('');
    setEventFilter('');
    setPlayerFilter('');
    setDateFilter('');
    setTimeout(() => {
      fetchLogs();
    }, 0);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 flex flex-col h-full">
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Game Logs</h2>
            <p className="text-gray-500 font-medium mt-1">Global chronological event stream</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handleFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team ID</label>
                <input
                  type="text"
                  value={teamIdFilter}
                  onChange={(e) => setTeamIdFilter(e.target.value)}
                  placeholder="e.g. TEAM05"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCodeFilter}
                  onChange={(e) => setRoomCodeFilter(e.target.value)}
                  placeholder="e.g. K7M2PX"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Round</label>
                <input
                  type="number"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                >
                  <option value="">All Stages</option>
                  <option value="WAITING">Waiting Room</option>
                  <option value="QUESTION">Question</option>
                  <option value="DISCUSSION">Discussion</option>
                  <option value="VOTING">Voting</option>
                  <option value="RESULT">Result</option>
                  <option value="REVEAL">Role Reveal</option>
                  <option value="NIGHT">Night</option>
                  <option value="MORNING">Morning</option>
                  <option value="COMPLETE">Game Complete</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Keywords</label>
                <input
                  type="text"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  placeholder="e.g. joined"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Player Name</label>
                <input
                  type="text"
                  value={playerFilter}
                  onChange={(e) => setPlayerFilter(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="submit">FILTER</Button>
              <Button variant="outline" type="button" onClick={handleClear}>CLEAR</Button>
            </div>
          </form>
        </div>
      </section>

      {/* Logs Table */}
      <section className="flex-1 overflow-hidden flex flex-col min-h-[500px]">
        {loading ? (
          <div className="p-10 text-center font-bold text-gray-500">Loading logs...</div>
        ) : (
          <LogViewer logs={logs} />
        )}
      </section>
    </div>
  );
}
