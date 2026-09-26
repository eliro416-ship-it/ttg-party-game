import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupGameSocketServer, setupRoomRoutes } from './server/gameServer';
import { setupPaymentRoutes } from './server/paymentServer';
import { setupLeaderboardRoutes } from './server/leaderboardServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  setupGameSocketServer(io);

  app.use(express.json());

  // Room metadata & language inspection
  setupRoomRoutes(app);

  // Payment & OTP verification routes
  setupPaymentRoutes(app);

  // Leaderboard ranking & scores routes
  setupLeaderboardRoutes(app);

  // Serve static files from public directory (videos, sounds, assets)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Standalone Single-File HTML download and view endpoints
  app.get('/standalone', (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'public/standalone.html'));
  });

  app.get('/download-standalone', (_req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
    res.sendFile(path.resolve(process.cwd(), 'standalone.html'));
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} (mode: ${isProd ? 'prod' : 'dev'})`);
  });
}

startServer();
