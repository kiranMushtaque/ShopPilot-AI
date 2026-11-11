import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter, apiErrorHandler } from './src/api/routes';
import { getValidatedConfig } from './src/config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const config = getValidatedConfig();
  const app = express();
  const PORT = config.PORT || 3000;

  // Middleware for body parsing and cookies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes (Mounted first)
  app.use('/api', apiRouter);

  // Central API error handling
  app.use(apiErrorHandler);

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShopPilot AI] Server running on http://0.0.0.0:${PORT} [${config.NODE_ENV}]`);
    console.log(`[ShopPilot AI] Health check available at http://0.0.0.0:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[ShopPilot AI] Fatal startup error:', err);
  process.exit(1);
});
