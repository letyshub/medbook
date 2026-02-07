import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// We need to mock the scraper before importing the router
vi.mock('../scraper/index.js', () => ({
  scrapeArticle: vi.fn(),
  ScraperException: class ScraperException extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'ScraperException';
    }
  },
}));

import router from './scraper.js';
import { scrapeArticle, ScraperException } from '../scraper/index.js';

describe('scraper API route', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api', router);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/scrape', () => {
    it('returns success response with article data', async () => {
      const mockArticle = {
        url: 'https://medium.com/test',
        title: 'Test Article',
        author: 'Test Author',
        publishedDate: '2026-02-07',
        content: '<p>Content</p>',
        images: [],
      };

      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/test' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Test Article');
    });

    it('returns 400 for missing URL', async () => {
      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_URL');
    });

    it('returns 400 for empty URL', async () => {
      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '   ' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('returns 400 for invalid JSON body', async () => {
      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('returns 400 for INVALID_URL error', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('INVALID_URL', 'Invalid URL')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/article' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_URL');
    });

    it('returns 404 for NOT_FOUND error', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('NOT_FOUND', 'Article not found')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/missing' }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 for PAYWALL error', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('PAYWALL', 'Article is paywalled')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/paywalled' }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('PAYWALL');
    });

    it('returns 504 for TIMEOUT error', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('TIMEOUT', 'Request timed out')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/slow' }),
      });

      expect(res.status).toBe(504);
      const json = await res.json();
      expect(json.error.code).toBe('TIMEOUT');
    });

    it('returns 500 for NETWORK_ERROR', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('NETWORK_ERROR', 'Network error')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/error' }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('NETWORK_ERROR');
    });

    it('returns 500 for unexpected errors', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(new Error('Unexpected error'));

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/test' }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NETWORK_ERROR');
    });

    it('error response has correct structure', async () => {
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperException('PARSE_ERROR', 'Failed to parse')
      );

      const res = await app.request('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://medium.com/test' }),
      });

      const json = await res.json();
      expect(json).toHaveProperty('success', false);
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
    });
  });
});
