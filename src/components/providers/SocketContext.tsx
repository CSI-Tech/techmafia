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

    s.on('connect', () => setConnected(true));
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

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const joinRoom = (teamId: string, roomCode: string, playerName: string) => {
    socket?.emit('joinRoom', { teamId, roomCode, playerName });
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
