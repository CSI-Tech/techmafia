import { io } from 'socket.io-client';

const PORT = process.env.PORT || '3000';
const BACKEND_URL = `http://localhost:${PORT}`;

console.log(`Connecting to ${BACKEND_URL}...`);
const socket = io(BACKEND_URL, {
  transports: ['websocket'], // Force WebSocket transport to avoid polling delay
});

socket.on('connect', () => {
  console.log('✅ Connected with ID:', socket.id);
  socket.emit('joinRoom', { teamId: 'UNGENERATED_TEAM_XYZ', roomCode: '123456', playerName: 'Alice' });
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});

socket.on('joinError', (err) => {
  console.log('✅ Received joinError:', err);
  socket.disconnect();
  process.exit(0);
});

setTimeout(() => {
  console.log('❌ Timeout reached');
  socket.disconnect();
  process.exit(1);
}, 5000);
