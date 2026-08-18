import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './src/lib/socket/handlers';
import { connectMongo } from './src/lib/db/connection';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Attach Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Admin namespace
  const adminNs = io.of('/admin');
  const globalForSockets = global as unknown as { adminNs?: typeof adminNs; io?: typeof io };
  globalForSockets.adminNs = adminNs;
  globalForSockets.io = io;

  // Setup handlers
  setupSocketHandlers(io, adminNs);

  // Connect to DB and start server
  connectMongo()
    .then(() => {
      httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port} (DB Connected)`);
      });
    })
    .catch((err) => {
      console.error('[Startup] MongoDB connection failed:', err);
      httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port} (DB Unavailable)`);
      });
    });
});
