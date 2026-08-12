import { gameManager } from '../src/lib/game/GameManager';

async function test() {
  console.log('Creating game team T_TEST...');
  const room = gameManager.getOrCreateTeam('T_TEST', '123456');

  console.log('Adding 8 players...');
  for (let i = 1; i <= 8; i++) {
    gameManager.joinTeam('T_TEST', '123456', `socket_id_${i}`, `Player${i}`);
  }

  console.log('Current players length:', room.players.length);

  console.log('Starting game...');
  const started = gameManager.startGame('T_TEST');
  console.log('Game started success:', started);

  console.log('Checking roles in backend team:');
  room.players.forEach(p => {
    console.log(`Player: ${p.name}, Role: ${p.role}`);
  });

  console.log('\nTransitioning to ROLE_REVEAL...');
  room.currentState = 'ROLE_REVEAL';

  console.log('Sanitizing states for each player (client-side data):');
  for (let i = 1; i <= 8; i++) {
    const clientState = gameManager.getSanitizedState('T_TEST', `socket_id_${i}`);
    console.log(`Player${i} client myRole:`, clientState?.myRole);
  }

  process.exit(0);
}

test();
