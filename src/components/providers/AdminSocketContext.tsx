"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AdminTeam, AdminTeamUpdate } from '@/types';

const BACKEND = '';
const ADMIN_HEADER = { 'x-admin-auth': 'true' } as const;

interface AdminSocketContextProps {
  connected: boolean;
  liveTeams: Record<string, AdminTeamUpdate>;   // keyed by teamId
  teams: AdminTeam[];                           // merged REST + live
  refreshTeams: () => Promise<void>;
}

const AdminSocketContext = createContext<AdminSocketContextProps | undefined>(undefined);

export const AdminSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [liveTeams, setLiveTeams] = useState<Record<string, AdminTeamUpdate>>({});
  const [teams, setTeams] = useState<AdminTeam[]>([]);

  const refreshTeams = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/teams`, { headers: ADMIN_HEADER });
      const data: { success: boolean; teams: AdminTeam[] } = await res.json();
      if (data.success) setTeams(data.teams);
    } catch {
      // silently ignore network errors
    }
  };

  useEffect(() => {
    refreshTeams();

    const socket: Socket = io(`${BACKEND}/admin`, {
      reconnectionDelay: 500,
      reconnectionAttempts: 20,
    });

    socket.on('connect', () => {
      setConnected(true);
    });
    socket.on('disconnect', () => setConnected(false));

    // Full snapshot on connect
    socket.on('adminSnapshot', (snapshot: AdminTeamUpdate[]) => {
      const map: Record<string, AdminTeamUpdate> = {};
      snapshot.forEach((t) => { map[t.teamId] = t; });
      setLiveTeams(map);
    });

    // Incremental updates
    socket.on('adminTeamUpdate', (update: AdminTeamUpdate) => {
      setLiveTeams((prev) => ({ ...prev, [update.teamId]: update }));
      // also refresh DB teams list when a game completes
      if (update.currentState === 'GAME_COMPLETE') refreshTeams();
    });

    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminSocketContext.Provider value={{ connected, liveTeams, teams, refreshTeams }}>
      {children}
    </AdminSocketContext.Provider>
  );
};

export const useAdminSocket = () => {
  const ctx = useContext(AdminSocketContext);
  if (!ctx) throw new Error('useAdminSocket must be used within AdminSocketProvider');
  return ctx;
};
