import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// Mock the scraper module
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

// Mock the pdf-generator module
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

// Mock the epub-generator module
vi.mock('../generators/epub-generator/index.js', () => ({
  generateEpub: vi.fn(),
  EPUB_MIME_TYPE: 'application/epub+zip',
}));

import router from './convert.js';
import { scrapeArticle, ScraperException } from '../scraper/index.js';
import { generatePdf, GeneratorException } from '../generators/pdf-generator/index.js';
import { generateEpub } from '../generators/epub-generator/index.js';

describe('convert API routes', () => {
  let app: Hono;
  let testCounter = 0;

  const mockArticle = {
    url: 'https://medium.com/@author/test-article',
    title: 'Test Article',
    subtitle: 'A test subtitle',
    author: 'Test Author',
    publishedDate: '2026-02-07',
    readingTime: '5 min',
    content: '<p>Test content</p>',
    images: [],
    tags: ['test'],
  };

  const mockPdfBuffer = Buffer.from('mock pdf content');
  const mockEpubBuffer = Buffer.from('mock epub content');

  // Helper to get unique IP for each test to avoid rate limiting
  const getUniqueIp = () => `192.168.1.${++testCounter}`;

  beforeEach(() => {
    app = new Hono();
    app.route('/api', router);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================
  // Task Group 1: /api/convert Happy Path Tests
  // ==========================================

  describe('POST /api/convert', () => {
    it('converts single URL to PDF', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test-article'],
          format: 'pdf',
          options: { title: 'Test eBook' },
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('Test eBook.pdf');
      expect(scrapeArticle).toHaveBeenCalledTimes(1);
      expect(generatePdf).toHaveBeenCalledTimes(1);
    });

    it('converts single URL to ePub', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);
      vi.mocked(generateEpub).mockResolvedValueOnce(mockEpubBuffer);

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test-article'],
          format: 'epub',
          options: { title: 'Test eBook' },
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/epub+zip');
      expect(res.headers.get('Content-Disposition')).toContain('Test eBook.epub');
      expect(generateEpub).toHaveBeenCalledTimes(1);
    });

    it('converts multiple URLs (batch processing)', async () => {
      vi.mocked(scrapeArticle)
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce({ ...mockArticle, title: 'Second Article' });
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: [
            'https://medium.com/@author/article-1',
            'https://medium.com/@author/article-2',
          ],
          format: 'pdf',
          options: { title: 'Batch eBook' },
        }),
      });

      expect(res.status).toBe(200);
      expect(scrapeArticle).toHaveBeenCalledTimes(2);
      expect(generatePdf).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Test Article' }),
          expect.objectContaining({ title: 'Second Article' }),
        ]),
        expect.any(Object)
      );
    });

    it('sets correct Content-Type and Content-Disposition headers', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test'],
          format: 'pdf',
          options: { title: 'My eBook' },
        }),
      });

      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="My eBook.pdf"');
      expect(res.headers.get('Content-Length')).toBe(mockPdfBuffer.length.toString());
    });
  });

  // ==========================================
  // Task Group 1: /api/preview Happy Path Tests
  // ==========================================

  describe('POST /api/preview', () => {
    it('returns metadata for single URL', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);

      const res = await app.request('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test-article'],
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.articles).toHaveLength(1);
      expect(json.data.articles[0]).toMatchObject({
        url: mockArticle.url,
        title: mockArticle.title,
        author: mockArticle.author,
        publishedDate: mockArticle.publishedDate,
        readingTime: mockArticle.readingTime,
      });
    });

    it('returns metadata for multiple URLs', async () => {
      const article2 = { ...mockArticle, url: 'https://example.com/2', title: 'Article 2' };
      vi.mocked(scrapeArticle)
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce(article2);

      const res = await app.request('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/1', 'https://medium.com/@author/2'],
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.articles).toHaveLength(2);
      expect(scrapeArticle).toHaveBeenCalledTimes(2);
    });

    it('returns only metadata fields (no content, images, tags)', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);

      const res = await app.request('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test'],
        }),
      });

      const json = await res.json();
      const article = json.data.articles[0];

      // Should have these fields
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('author');
      expect(article).toHaveProperty('publishedDate');
      expect(article).toHaveProperty('readingTime');

      // Should NOT have these fields
      expect(article).not.toHaveProperty('content');
      expect(article).not.toHaveProperty('images');
      expect(article).not.toHaveProperty('tags');
      expect(article).not.toHaveProperty('subtitle');
    });
  });

  // ==========================================
  // Task Group 2: Validation & Error Handling Tests
  // ==========================================

  describe('Validation errors', () => {
    it('returns 400 for missing urls array', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          format: 'pdf',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for empty urls array', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: [],
          format: 'pdf',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for too many URLs (>10)', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: Array(11).fill('https://medium.com/@author/article'),
          format: 'pdf',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
      expect(json.error.message).toContain('10');
    });

    it('returns 400 for invalid format value', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/article'],
          format: 'docx',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for missing title in options', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/article'],
          format: 'pdf',
          options: {},
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for invalid JSON body', async () => {
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: 'not valid json',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('passes through scraper errors correctly', async () => {
      const ScraperExceptionClass = ScraperException as unknown as new (code: string, message: string) => Error & { code: string };
      vi.mocked(scrapeArticle).mockRejectedValueOnce(
        new ScraperExceptionClass('NOT_FOUND', 'Article not found')
      );

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/missing'],
          format: 'pdf',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });

  // ==========================================
  // Task Group 2: Edge Case Tests
  // ==========================================

  describe('Edge cases', () => {
    it('sanitizes very long title', async () => {
      vi.mocked(scrapeArticle).mockResolvedValueOnce(mockArticle);
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const longTitle = 'A'.repeat(200);
      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/test'],
          format: 'pdf',
          options: { title: longTitle },
        }),
      });

      expect(res.status).toBe(200);
      const disposition = res.headers.get('Content-Disposition');
      // Filename should be truncated to max 100 characters
      expect(disposition).not.toContain(longTitle);
      expect(disposition?.length).toBeLessThan(150);
    });

    it('processes duplicate URLs normally', async () => {
      vi.mocked(scrapeArticle).mockResolvedValue(mockArticle);
      vi.mocked(generatePdf).mockResolvedValueOnce(mockPdfBuffer);

      const res = await app.request('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: [
            'https://medium.com/@author/same',
            'https://medium.com/@author/same',
          ],
          format: 'pdf',
          options: { title: 'Test' },
        }),
      });

      expect(res.status).toBe(200);
      // Should scrape both URLs even if they're duplicates
      expect(scrapeArticle).toHaveBeenCalledTimes(2);
    });

    it('handles preview with missing optional fields', async () => {
      const minimalArticle = {
        url: 'https://medium.com/@author/minimal',
        title: 'Minimal Article',
        author: 'Author',
        publishedDate: '2026-02-07',
        content: '<p>Content</p>',
        images: [],
        tags: [],
        // Note: readingTime may be missing
      };
      vi.mocked(scrapeArticle).mockResolvedValueOnce(minimalArticle as any);

      const res = await app.request('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': getUniqueIp() },
        body: JSON.stringify({
          urls: ['https://medium.com/@author/minimal'],
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.articles[0]).toHaveProperty('url');
      expect(json.data.articles[0]).toHaveProperty('title');
    });
  });
});
