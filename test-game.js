/* eslint-disable */
const { io } = require('socket.io-client');

const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
const teamId = 'TEAM_' + randomId;
const roomCode = 'ROOM_' + randomId;
const sockets = [];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
  console.log(`\n=== TechMafia Full Flow Test ===`);
  console.log(`Team: ${teamId}, Room: ${roomCode}\n`);

  // Connect 8 players
  for (let i = 1; i <= 8; i++) {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      socket.emit('joinRoom', { teamId, roomCode, playerName: `Player${i}` });
    });

    socket.on('gameStateSync', (state) => {
      const me = state;
      // Print minimal info per state change
      if (i === 1) {
        console.log(`[State] ${state.currentState} | Round ${state.currentRound} | Alive: ${state.alivePlayers}`);
        if (state.myRound1Question) console.log(`  -> Question: "${state.myRound1Question.question}"`);
        if (state.morningResults?.length) console.log(`  -> Morning: ${state.morningResults.join('; ')}`);
        if (state.eliminatedThisRound) console.log(`  -> Eliminated: ${state.eliminatedThisRound} (${state.eliminatedRoleThisRound})`);
      }
    });

    socket.on('joinError', (err) => console.error(`Player ${i} join error:`, err));
    sockets.push(socket);
    await sleep(100);
  }

  await sleep(500);
  console.log('[Action] Starting game...');
  sockets[0].emit('startGame', { teamId });
  await sleep(500);

  // Submit all Round 1 answers
  console.log('[Action] Submitting Round 1 answers...');
  for (const s of sockets) {
    s.emit('submitRound1Answer', { teamId, answer: 'ANYTHING' });
    await sleep(50);
  }
  await sleep(500);

  // Submit all votes (each player votes for Player1)
  console.log('[Action] Submitting votes...');
  for (const s of sockets) {
    s.emit('submitVote', { teamId, targetName: 'Player1' });
    await sleep(50);
  }
  await sleep(500);

  // Proceed to night (Role Reveal -> Night)
  console.log('[Action] proceedToNight (ROUND_1_RESULT -> ROLE_REVEAL)...');
  sockets[0].emit('proceedToNight', { teamId });
  await sleep(200);

  console.log('[Action] proceedToNight (ROLE_REVEAL -> NIGHT)...');
  sockets[0].emit('proceedToNight', { teamId });
  await sleep(500);

  // Submit night actions
  console.log('[Action] Submitting night actions...');
  // Get socket IDs so we can target them
  const playerIds = sockets.map(s => s.id);
  for (const s of sockets) {
    // Try to submit night action (Mafia/Investigator) - target player 2
    s.emit('submitNightAction', { teamId, targetId: playerIds[1] });
    // Try to submit night quiz (Civilians)
    s.emit('submitNightQuiz', { teamId, answer: 'Mars' });
    await sleep(50);
  }
  await sleep(500);

  console.log('\n=== Test Complete ===');
  sockets.forEach(s => s.disconnect());
}

test().catch(console.error);
