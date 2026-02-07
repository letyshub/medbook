import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// Mock the pdf-generator module before importing the router
vi.mock('../generators/pdf-generator/index.js', () => ({
  generatePdf: vi.fn(),
  GeneratorException: class GeneratorException extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'GeneratorException';
    }
  },
}));

import router from './generator.js';
import { generatePdf, GeneratorException } from '../generators/pdf-generator/index.js';

describe('generator API route', () => {
  let app: Hono;

  const mockArticle = {
    url: 'https://example.com/article',
    title: 'Test Article',
    author: 'Test Author',
    publishedDate: '2026-02-07',
    content: '<p>Test content</p>',
    images: [],
  };

  const mockPdfBuffer = Buffer.from('mock pdf content');

  beforeEach(() => {
    app = new Hono();
    app.route('/api', router);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/generate-pdf', () => {
    it('returns PDF buffer for valid request', async () => {
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test eBook' },
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('Test eBook.pdf');
    });

    it('sets correct Content-Length header', async () => {
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.headers.get('Content-Length')).toBe(
        mockPdfBuffer.length.toString()
      );
    });

    it('returns 400 for missing title', async () => {
      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: {},
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for EMPTY_ARTICLES error', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('EMPTY_ARTICLES', 'At least one article required')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('EMPTY_ARTICLES');
    });

    it('returns 400 for TOO_MANY_ARTICLES error', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('TOO_MANY_ARTICLES', 'Max 50 articles')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('TOO_MANY_ARTICLES');
    });

    it('returns 400 for CONTENT_TOO_LARGE error', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('CONTENT_TOO_LARGE', 'Content exceeds limit')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('CONTENT_TOO_LARGE');
    });

    it('returns 504 for TIMEOUT error', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('TIMEOUT', 'PDF generation timed out')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(504);
      const json = await res.json();
      expect(json.error.code).toBe('TIMEOUT');
    });

    it('returns 500 for RENDER_ERROR', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('RENDER_ERROR', 'Failed to render')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('RENDER_ERROR');
    });

    it('returns 500 for unexpected errors', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('RENDER_ERROR');
    });

    it('sanitizes filename in Content-Disposition', async () => {
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test <script>evil</script> eBook' },
        }),
      });

      const disposition = res.headers.get('Content-Disposition');
      expect(disposition).not.toContain('<script>');
      expect(disposition).toContain('Test');
      expect(disposition).toContain('eBook');
    });

    it('error response has correct structure', async () => {
      vi.mocked(generatePdf).mockRejectedValueOnce(
        new GeneratorException('INVALID_INPUT', 'Test error message')
      );

      const res = await app.request('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: [mockArticle],
          options: { title: 'Test' },
        }),
      });

      const json = await res.json();
      expect(json).toHaveProperty('success', false);
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
    });
  });
});
