import { io } from 'socket.io-client';

console.log('Connecting to admin socket at http://localhost:3000/admin ...');
const socket = io('http://localhost:3000/admin', {
  reconnectionDelay: 500,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('Successfully connected to admin namespace!');
  console.log('Socket ID:', socket.id);
});

socket.on('adminSnapshot', (snapshot) => {
  console.log('Received adminSnapshot:', JSON.stringify(snapshot, null, 2));
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

// Timeout after 8 seconds
setTimeout(() => {
  console.error('Timeout waiting for admin socket connection.');
  process.exit(1);
}, 8000);
