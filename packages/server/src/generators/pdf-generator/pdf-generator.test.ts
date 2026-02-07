import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePdf } from './pdf-renderer.js';
import { GeneratorException } from './types.js';
import type { Article } from './types.js';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

import puppeteer from 'puppeteer';

describe('pdf-generator', () => {
  const mockArticle: Article = {
    url: 'https://example.com/article',
    title: 'Test Article',
    author: 'Test Author',
    publishedDate: '2026-02-07',
    content: '<p>Test content</p>',
    images: [],
  };

  const mockPdfBuffer = Buffer.from('mock pdf content');

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Puppeteer
    const mockPage = {
      setContent: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(mockPdfBuffer),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validation', () => {
    it('throws INVALID_INPUT for non-array articles', async () => {
      await expect(
        generatePdf(null as any, { title: 'Test' })
      ).rejects.toThrow(GeneratorException);

      await expect(
        generatePdf('not an array' as any, { title: 'Test' })
      ).rejects.toThrow(GeneratorException);
    });

    it('throws EMPTY_ARTICLES for empty array', async () => {
      await expect(
        generatePdf([], { title: 'Test' })
      ).rejects.toThrow(GeneratorException);

      try {
        await generatePdf([], { title: 'Test' });
      } catch (error) {
        expect(error).toBeInstanceOf(GeneratorException);
        expect((error as GeneratorException).code).toBe('EMPTY_ARTICLES');
      }
    });

    it('throws TOO_MANY_ARTICLES when exceeding limit', async () => {
      const tooManyArticles = Array(51).fill(mockArticle);

      try {
        await generatePdf(tooManyArticles, { title: 'Test' });
      } catch (error) {
        expect(error).toBeInstanceOf(GeneratorException);
        expect((error as GeneratorException).code).toBe('TOO_MANY_ARTICLES');
      }
    });

    it('throws INVALID_INPUT for missing title', async () => {
      await expect(
        generatePdf([mockArticle], {} as any)
      ).rejects.toThrow(GeneratorException);

      try {
        await generatePdf([mockArticle], { title: '' } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(GeneratorException);
        expect((error as GeneratorException).code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('successful generation', () => {
    it('returns Buffer on success', async () => {
      const result = await generatePdf([mockArticle], { title: 'Test eBook' });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('launches puppeteer with correct options', async () => {
      await generatePdf([mockArticle], { title: 'Test' });

      expect(puppeteer.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: true,
        })
      );
    });

    it('sets page content and generates PDF', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(mockPdfBuffer),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      await generatePdf([mockArticle], { title: 'Test' });

      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
    });

    it('closes browser after generation', async () => {
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue({
          setContent: vi.fn().mockResolvedValue(undefined),
          pdf: vi.fn().mockResolvedValue(mockPdfBuffer),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      await generatePdf([mockArticle], { title: 'Test' });

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('options handling', () => {
    it('uses default options when not provided', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(mockPdfBuffer),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      await generatePdf([mockArticle], { title: 'Test' });

      // PDF should be called with A4 format (default)
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
        })
      );
    });

    it('uses provided page size', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(mockPdfBuffer),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      await generatePdf([mockArticle], { title: 'Test', pageSize: 'Letter' });

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'Letter',
        })
      );
    });
  });

  describe('error handling', () => {
    it('throws RENDER_ERROR on Puppeteer failure', async () => {
      vi.mocked(puppeteer.launch).mockRejectedValue(new Error('Browser failed'));

      try {
        await generatePdf([mockArticle], { title: 'Test' });
      } catch (error) {
        expect(error).toBeInstanceOf(GeneratorException);
        expect((error as GeneratorException).code).toBe('RENDER_ERROR');
      }
    });

    it('closes browser even on error', async () => {
      const mockBrowser = {
        newPage: vi.fn().mockRejectedValue(new Error('Page failed')),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      try {
        await generatePdf([mockArticle], { title: 'Test' });
      } catch {
        // Expected
      }

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('handles timeout errors', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockRejectedValue(new Error('timeout exceeded')),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

      try {
        await generatePdf([mockArticle], { title: 'Test' });
      } catch (error) {
        expect(error).toBeInstanceOf(GeneratorException);
        expect((error as GeneratorException).code).toBe('TIMEOUT');
      }
    });
  });
});
