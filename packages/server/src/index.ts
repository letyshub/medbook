import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import scraperRoutes from './routes/scraper.js';
import generatorRoutes from './routes/generator.js';
import convertRoutes from './routes/convert.js';

const app = new Hono();

// Register routes
app.route('/api', scraperRoutes);
app.route('/api', generatorRoutes);
app.route('/api', convertRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// Root endpoint
app.get('/api', (c) => {
  return c.json({ message: 'Medium to eBook API' });
});

const port = 3001;

console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
