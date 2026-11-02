import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/server/routes/auth.js';
import userRoutes from './src/server/routes/user.js';
import adminRoutes from './src/server/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', platform: 'TK EARNED BD', version: '2.0.0' });
  });

  // Serve static assets from src/assets if needed
  app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SULTAN EARN server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting SULTAN EARN server:', err);
});
