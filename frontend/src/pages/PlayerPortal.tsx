import { Navigate } from 'react-router-dom';
import { useSocket } from '../services/SocketContext';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { WaitingRoom } from '../components/player/WaitingRoom';
import { RoleReveal } from '../components/player/RoleReveal';
import { Discussion } from '../components/player/Discussion';
import { Voting } from '../components/player/Voting';
import { VoteResult } from '../components/player/VoteResult';
import { Elimination } from '../components/player/Elimination';
import { GameResult } from '../components/player/GameResult';

export function PlayerPortal() {
  const { gameState, connected } = useSocket();

  if (!gameState) return <Navigate to="/" replace />;

  const renderScreen = () => {
    switch (gameState.currentState) {
      case 'WAITING_FOR_PLAYERS':
      case 'READY':
        return <WaitingRoom />;
      case 'ROLE_REVEAL':
        return <RoleReveal />;
      case 'DISCUSSION':
        return <Discussion />;
      case 'VOTING':
        return <Voting />;
      case 'VOTE_RESULT':
        return <VoteResult />;
      case 'ELIMINATION':
        return <Elimination />;
      case 'GAME_COMPLETE':
        return <GameResult />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen">
      <ConnectionBanner connected={connected} />
      {renderScreen()}
    </div>
  );
}
