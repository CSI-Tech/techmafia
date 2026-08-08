import { useState } from 'react';
import { useSocket } from '../../services/SocketContext';
import { Button } from '../Button';

export function RoleReveal() {
  const { gameState, startDiscussion } = useSocket();
  const [revealed, setRevealed] = useState(false);

  if (!gameState) return null;

  const isMafia = gameState.myRole === 'MAFIA';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="flex-1 flex flex-col p-6 pt-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Role Assignment</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Your Secret Role</h1>
          <p className="text-sm text-gray-400 font-medium mt-2">Keep your phone screen hidden from others</p>
        </div>

        {/* Role Card */}
        <div className="flex-1 flex flex-col">
          {!revealed ? (
            /* Tap-to-reveal button */
            <button
              onClick={() => setRevealed(true)}
              className="flex-1 bg-primary rounded-3xl flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-transform min-h-[300px] shadow-md"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-white text-2xl font-extrabold tracking-wider">TAP TO REVEAL</span>
              <span className="text-white/70 text-sm font-medium">Make sure no one is watching</span>
            </button>
          ) : (
            /* Revealed card */
            <div className={`flex-1 rounded-3xl border-2 flex flex-col items-center justify-center p-8 gap-6 min-h-[300px] shadow-sm ${
              isMafia ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              {/* Role badge */}
              <div className={`px-6 py-2 rounded-full font-extrabold text-sm uppercase tracking-widest ${
                isMafia ? 'bg-primary text-white' : 'bg-blue-600 text-white'
              }`}>
                {gameState.myRole}
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Secret Word</p>
                <div className={`mt-2 px-8 py-4 rounded-2xl ${isMafia ? 'bg-primary/10' : 'bg-blue-100'}`}>
                  <span className={`text-3xl font-extrabold tracking-wider ${isMafia ? 'text-primary' : 'text-blue-700'}`}>
                    {gameState.myWord}
                  </span>
                </div>
              </div>

              {isMafia && gameState.myMafiaPartner && (
                <div className="w-full border-t border-red-200 pt-4 text-center">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Your Mafia Partner</p>
                  <p className="text-xl font-bold text-gray-900">{gameState.myMafiaPartner}</p>
                  <p className="text-xs text-gray-400 mt-1">Work together. Stay hidden.</p>
                </div>
              )}

              <button
                onClick={() => setRevealed(false)}
                className="text-sm font-semibold text-gray-400 underline underline-offset-2 mt-2"
              >
                Hide role
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pb-10">
        <p className="text-center text-xs text-gray-400 font-medium mb-4">
          {revealed
            ? `Remember your word: ${gameState.myWord}. Do not say it directly.`
            : 'Tap the card above to view your role.'}
        </p>
        <Button onClick={startDiscussion} disabled={!revealed}>
          I'M READY — START DISCUSSION
        </Button>
      </div>
    </div>
  );
}
