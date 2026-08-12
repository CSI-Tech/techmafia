/* eslint-disable */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Attach Socket.IO
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Admin Socket.IO namespace
  const adminNs = io.of('/admin');

  // Load socket handlers dynamically so we can use TypeScript compiled output or TSX later
  // For now, we will require the compiled/transpiled handlers if we use tsx, or we can just let Next.js compile them if they are part of the app.
  // Wait, server.js runs OUTSIDE of webpack. It runs in plain Node.js. 
  // If we want to use TypeScript for socket handlers, we must compile them or run the server with `tsx`.
  // Let's assume we will run the server with `tsx server.ts` so we can import our TS files natively!
});
