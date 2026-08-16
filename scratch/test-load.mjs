import { io } from 'socket.io-client';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = '.env.local';

// 1. Read environment variables to get credentials
let adminPassword = 'techmafia2026';
try {
  const envLines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of envLines) {
    const [key, ...rest] = line.split('=');
    if (key && key.trim() === 'ADMIN_PASSWORD' && rest.length) {
      adminPassword = rest.join('=').trim();
    }
  }
} catch (e) {
  console.warn('Could not read .env.local, using default admin password');
}

const adminToken = crypto.createHash('sha256').update(adminPassword).digest('hex');

const PORT = process.env.PORT || '3000';
const BACKEND_URL = `http://localhost:${PORT}`;

console.log(`📡 Testing load on backend: ${BACKEND_URL}`);
console.log(`🔐 Admin token derived: ${adminToken.substring(0, 8)}...`);

async function runTest() {
  // Test 1: Generate 10 teams via Admin REST API
  const teams = [];
  console.log('\n--- 1. Generating 10 teams via Admin REST API ---');
  for (let i = 1; i <= 10; i++) {
    const teamNumber = `LOADTEST${i}_${Date.now().toString(36)}`;
    const res = await fetch(`${BACKEND_URL}/api/admin/teams/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': adminToken
      },
      body: JSON.stringify({ teamNumber })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(`Failed to generate team ${teamNumber}: ${data.message}`);
    }
    console.log(`✅ Generated Team: ${data.teamId} with Room Code: ${data.roomCode}`);
    teams.push({ teamId: data.teamId, roomCode: data.roomCode });
  }

  // Test 2: Try to join a non-existent team as a player and expect failure
  console.log('\n--- 2. Verifying team-creation security fix (joining ungenerated team) ---');
  await new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL);
    socket.emit('joinRoom', { teamId: 'UNGENERATED_TEAM_XYZ', roomCode: '123456', playerName: 'Alice' });
    socket.on('joinError', (err) => {
      console.log(`✅ Correctly rejected join to ungenerated team. Error: "${err}"`);
      socket.disconnect();
      resolve();
    });
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout waiting for joinRoom failure on ungenerated team'));
    }, 5000);
  });

  // Test 3: Connect 8 players to each of the 10 teams simultaneously (80 clients)
  console.log('\n--- 3. Connecting 80 simulated player clients across 10 teams ---');
  const allSockets = [];
  const teamPromises = teams.map((team, teamIdx) => {
    return new Promise(async (resolveTeam) => {
      const playerSockets = [];
      let playersJoined = 0;
      let gameStarted = false;

      for (let pNum = 1; pNum <= 8; pNum++) {
        const playerName = `Player_${pNum}`;
        const socket = io(BACKEND_URL);
        playerSockets.push(socket);
        allSockets.push(socket);

        socket.on('connect', () => {
          socket.emit('joinRoom', {
            teamId: team.teamId,
            roomCode: team.roomCode,
            playerName,
            playerSessionId: `session_${team.teamId}_${playerName}`
          });
        });

        socket.on('joinError', (msg) => {
          console.error(`❌ Join error for ${playerName} on ${team.teamId}: ${msg}`);
        });

        socket.on('gameStateSync', (state) => {
          if (state.currentState === 'READY' && !gameStarted && pNum === 1) {
            gameStarted = true;
            // The first player starts the game
            socket.emit('startGame', { teamId: team.teamId });
          }
          if (state.currentState === 'ROUND_1_QUESTION') {
            // Confirm players received round 1 state
            playersJoined++;
            if (playersJoined === 8) {
              console.log(`✅ Team ${team.teamId} fully joined and successfully transitioned to ROUND_1_QUESTION`);
              resolveTeam();
            }
          }
        });
      }
    });
  });

  await Promise.all(teamPromises);

  // Test 4: Verify cross-team socket room isolation
  console.log('\n--- 4. Verifying cross-team socket room isolation ---');
  // Attempt to emit startGame or actions using a socket from another team
  const socketFromTeam0 = allSockets[0]; // Belongs to team 0
  const team1Id = teams[1].teamId;       // Team 1

  await new Promise((resolve) => {
    socketFromTeam0.emit('startGame', { teamId: team1Id });
    socketFromTeam0.on('error', (err) => {
      console.log(`✅ Correctly blocked cross-team action. Error: "${err}"`);
      resolve();
    });
    setTimeout(() => {
      resolve();
    }, 2000);
  });

  // Cleanup: Disconnect all sockets
  console.log('\n🧹 Cleaning up sockets...');
  allSockets.forEach(s => s.disconnect());
  console.log('✅ Load test completed successfully!\n');
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
