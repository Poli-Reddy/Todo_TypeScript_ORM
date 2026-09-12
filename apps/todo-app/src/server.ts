import express from 'express';
import cors from 'cors';
import { router } from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Render (and most PaaS) requires binding to 0.0.0.0, not localhost.

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root: API info (so GET / doesn't return "Cannot GET /")
app.get('/', (req, res) => {
  res.json({
    name: 'Todo API',
    status: 'ok',
    health: '/health',
    endpoints: [
      'GET /api/todos',
      'GET /api/todos?filter=completed|incomplete',
      'GET /api/todos/:id',
      'POST /api/todos',
      'PUT /api/todos/:id',
      'DELETE /api/todos/:id',
    ],
  });
});

// JSON 404 for any other unknown route
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (bind 0.0.0.0 for Render).
// Skip auto-listen under test so supertest can import the app without binding a port.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Todo API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
