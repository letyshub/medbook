import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

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
