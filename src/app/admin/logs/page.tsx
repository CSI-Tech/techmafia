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
  const [eventFilter, setEventFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (teamIdFilter) query.append('teamId', teamIdFilter);
      if (roomCodeFilter) query.append('roomCode', roomCodeFilter);
      if (eventFilter) query.append('event', eventFilter);

      const res = await fetch(`http://localhost:3001/api/admin/logs?${query.toString()}`, {
        headers: { 'x-admin-auth': 'true' }
      });
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
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleClear = () => {
    setTeamIdFilter('');
    setRoomCodeFilter('');
    setEventFilter('');
    setTimeout(() => {
      fetchLogs(); // relies on state batching, but safest to just call manually or wait for effect. Actually, let's just trigger a re-fetch without filters.
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
          <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team ID</label>
              <input
                type="text"
                value={teamIdFilter}
                onChange={(e) => setTeamIdFilter(e.target.value)}
                placeholder="e.g. TEAM05"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Code</label>
              <input
                type="text"
                value={roomCodeFilter}
                onChange={(e) => setRoomCodeFilter(e.target.value)}
                placeholder="e.g. K7M2PX"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Type</label>
              <input
                type="text"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                placeholder="e.g. eliminated"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-2">
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
