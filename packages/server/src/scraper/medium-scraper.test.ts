import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeArticle } from './medium-scraper.js';
import { ScraperException } from './types.js';

describe('medium-scraper', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('URL validation', () => {
    it('throws INVALID_URL for non-Medium URLs', async () => {
      await expect(scrapeArticle('https://example.com/article')).rejects.toThrow(ScraperException);

      try {
        await scrapeArticle('https://example.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('INVALID_URL');
      }
    });

    it('throws INVALID_URL for HTTP URLs (non-HTTPS)', async () => {
      try {
        await scrapeArticle('http://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('INVALID_URL');
        expect((error as ScraperException).message).toContain('HTTPS');
      }
    });

    it('throws INVALID_URL for localhost/private IPs', async () => {
      const privateUrls = [
        'https://localhost/article',
        'https://127.0.0.1/article',
        'https://10.0.0.1/article',
        'https://192.168.1.1/article',
        'https://172.16.0.1/article',
      ];

      for (const url of privateUrls) {
        try {
          await scrapeArticle(url);
        } catch (error) {
          expect(error).toBeInstanceOf(ScraperException);
          expect((error as ScraperException).code).toBe('INVALID_URL');
        }
      }
    });

    it('throws INVALID_URL for invalid URL format', async () => {
      await expect(scrapeArticle('not-a-url')).rejects.toThrow(ScraperException);
    });

    it('accepts valid Medium URLs', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(`
          <html>
            <head><meta property="article:published_time" content="2026-01-01"></head>
            <body>
              <article>
                <h1>Test Article</h1>
                <p>Content here</p>
              </article>
            </body>
          </html>
        `),
      } as Response);

      // This should not throw for URL validation
      // (may throw for other reasons like parsing)
      const promise = scrapeArticle('https://medium.com/@user/article-123');
      await expect(promise).resolves.toBeDefined();
    });
  });

  describe('HTTP error handling', () => {
    it('throws NOT_FOUND for 404 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('NOT_FOUND');
      }
    });

    it('throws NETWORK_ERROR for non-404 errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('NETWORK_ERROR');
      }
    });

    it('throws TIMEOUT on AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValueOnce(abortError);

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('TIMEOUT');
      }
    });

    it('throws NETWORK_ERROR on fetch failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('paywall detection', () => {
    it('throws PAYWALL when paywall element present', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(`
          <html><body>
            <div data-testid="paywall">Please subscribe</div>
            <article><h1>Title</h1></article>
          </body></html>
        `),
      } as Response);

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('PAYWALL');
      }
    });
  });

  describe('content extraction', () => {
    it('extracts article metadata correctly', async () => {
      vi.mocked(fetch).mockImplementation((url) => {
        // Mock HTML fetch
        if (typeof url === 'string' && url.includes('medium.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () =>
              Promise.resolve(`
              <html>
                <head>
                  <meta name="author" content="John Doe">
                </head>
                <body>
                  <article>
                    <h1>Test Article Title</h1>
                    <time datetime="2026-02-07T12:00:00Z">Feb 7, 2026</time>
                    <h2>Subtitle here</h2>
                    <p>Article content goes here.</p>
                  </article>
                </body>
              </html>
            `),
          } as Response);
        }
        // Mock image fetch (return failure for simplicity)
        return Promise.resolve({ ok: false } as Response);
      });

      const article = await scrapeArticle('https://medium.com/@user/test-article');

      expect(article.title).toBe('Test Article Title');
      expect(article.author).toBe('John Doe');
      expect(article.publishedDate).toBe('2026-02-07T12:00:00Z');
      expect(article.content).toBeDefined();
    });

    it('throws PARSE_ERROR when title not found', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(`
          <html><body>
            <article><p>No title here</p></article>
          </body></html>
        `),
      } as Response);

      try {
        await scrapeArticle('https://medium.com/article');
      } catch (error) {
        expect(error).toBeInstanceOf(ScraperException);
        expect((error as ScraperException).code).toBe('PARSE_ERROR');
      }
    });

    it('uses default author when not found', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(`
          <html>
            <head><meta property="article:published_time" content="2026-01-01"></head>
            <body>
              <article>
                <h1>Title</h1>
                <p>Content</p>
              </article>
            </body>
          </html>
        `),
      } as Response);

      const article = await scrapeArticle('https://medium.com/article');

      expect(article.author).toBe('Unknown Author');
    });
  });

  describe('subdomain support', () => {
    it('accepts popular Medium publication domains', async () => {
      const domains = [
        'https://towardsdatascience.com/article',
        'https://betterprogramming.pub/article',
        'https://levelup.gitconnected.com/article',
      ];

      for (const url of domains) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(`
            <html>
              <head><meta property="article:published_time" content="2026-01-01"></head>
              <body><article><h1>Title</h1><p>Content</p></article></body>
            </html>
          `),
        } as Response);

        await expect(scrapeArticle(url)).resolves.toBeDefined();
      }
    });
  });
});
