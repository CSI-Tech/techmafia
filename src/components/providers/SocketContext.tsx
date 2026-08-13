"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SanitizedGameState } from '@/types';

interface SocketContextProps {
  socket: Socket | null;
  connected: boolean;
  gameState: SanitizedGameState | null;
  error: string | null;
  joinRoom: (teamId: string, roomCode: string, playerName: string) => void;
  startGame: () => void;
  startDiscussion: () => void;
  submitVote: (targetName: string) => void;
  submitRound1Answer: (answer: string) => void;
  submitNightAction: (targetId: string) => void;
  submitNightQuiz: (answer: string) => void;
  proceedToNight: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<SanitizedGameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = io('', {
      reconnectionDelay: 500,
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setConnected(true);
      const playerName = sessionStorage.getItem('techmafia_playerName');
      const teamId = sessionStorage.getItem('techmafia_teamId');
      const roomCode = sessionStorage.getItem('techmafia_roomCode');
      if (playerName && teamId && roomCode) {
        s.emit('joinRoom', { teamId, roomCode, playerName });
      }
    });
    s.on('disconnect', () => setConnected(false));

    s.on('gameStateSync', (state: SanitizedGameState) => {
      setGameState(state);
      setError(null);
    });

    s.on('joinError', (msg: string) => {
      setError(msg);
    });

    s.on('error', (msg: string) => {
      setError(msg);
    });

    setTimeout(() => {
      setSocket(s);
    }, 0);
    return () => { s.disconnect(); };
  }, []);

  const joinRoom = (teamId: string, roomCode: string, playerName: string) => {
    let playerSessionId = sessionStorage.getItem('techmafia_playerSessionId');
    if (!playerSessionId) {
      playerSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('techmafia_playerSessionId', playerSessionId);
    }
    sessionStorage.setItem('techmafia_playerName', playerName);
    sessionStorage.setItem('techmafia_teamId', teamId);
    sessionStorage.setItem('techmafia_roomCode', roomCode);
    socket?.emit('joinRoom', { teamId, roomCode, playerName, playerSessionId });
  };

  const startGame = () => {
    if (gameState) socket?.emit('startGame', { teamId: gameState.teamId });
  };

  const startDiscussion = () => {
    if (gameState) socket?.emit('startDiscussion', { teamId: gameState.teamId });
  };

  const submitVote = (targetName: string) => {
    if (gameState) socket?.emit('submitVote', { teamId: gameState.teamId, targetName });
  };

  const submitRound1Answer = (answer: string) => {
    if (gameState) socket?.emit('submitRound1Answer', { teamId: gameState.teamId, answer });
  };

  const submitNightAction = (targetId: string) => {
    if (gameState) socket?.emit('submitNightAction', { teamId: gameState.teamId, targetId });
  };

  const submitNightQuiz = (answer: string) => {
    if (gameState) socket?.emit('submitNightQuiz', { teamId: gameState.teamId, answer });
  };

  const proceedToNight = () => {
    if (gameState) socket?.emit('proceedToNight', { teamId: gameState.teamId });
  };

  const clearError = () => setError(null);

  return (
    <SocketContext.Provider value={{
      socket, connected, gameState, error,
      joinRoom, startGame, startDiscussion, submitVote,
      submitRound1Answer, submitNightAction, submitNightQuiz,
      proceedToNight, clearError,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};
