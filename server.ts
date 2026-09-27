import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupGameSocketServer } from './server/gameServer';

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

  // Explicitly serve static public assets (og-image.png, favicon, etc.)
  app.use(express.static(path.resolve(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (filePath.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      }
    }
  }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  let vite: any = null;
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Ensure WhatsApp and social scrapers receive full absolute og:image URL
  app.get(['/', '/index.html'], async (req, res, next) => {
    const accept = req.headers.accept || '';
    const userAgent = req.headers['user-agent'] || '';
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Discordbot/i.test(userAgent);

    if (isCrawler || accept.includes('text/html')) {
      const host = req.get('host') || 'localhost:3000';
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const proto = (req.headers['x-forwarded-proto'] as string) || (isLocal ? 'http' : 'https');
      const baseUrl = `${proto}://${host}`;
      const ogImageUrl = `${baseUrl}/og-image.png`;

      const indexPath = isProd
        ? path.resolve(__dirname, 'dist', 'index.html')
        : path.resolve(__dirname, 'index.html');

      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = html
          .replace(/content="\/og-image\.png"/g, `content="${ogImageUrl}"`)
          .replace(/href="\/og-image\.png"/g, `href="${ogImageUrl}"`);

        if (!isProd && vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }
    next();
  });

  if (!isProd && vite) {
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
