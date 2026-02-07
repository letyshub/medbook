import { describe, it, expect } from 'vitest';
import {
  ScraperException,
  type ErrorCode,
  type Article,
  type ArticleImage,
  type ApiResponse,
} from './types.js';

describe('types', () => {
  describe('ScraperException', () => {
    it('creates exception with code and message', () => {
      const error = new ScraperException('INVALID_URL', 'Test message');

      expect(error.code).toBe('INVALID_URL');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('ScraperException');
    });

    it('is instanceof Error', () => {
      const error = new ScraperException('TIMEOUT', 'Timeout occurred');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ScraperException);
    });

    it('supports all error codes', () => {
      const codes: ErrorCode[] = [
        'INVALID_URL',
        'TIMEOUT',
        'NOT_FOUND',
        'PAYWALL',
        'NETWORK_ERROR',
        'PARSE_ERROR',
      ];

      for (const code of codes) {
        const error = new ScraperException(code, `Error: ${code}`);
        expect(error.code).toBe(code);
      }
    });
  });

  describe('type exports', () => {
    it('Article interface has required fields', () => {
      const article: Article = {
        url: 'https://medium.com/test',
        title: 'Test Article',
        author: 'Test Author',
        publishedDate: '2026-02-07',
        content: '<p>Test content</p>',
        images: [],
      };

      expect(article.url).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.author).toBeDefined();
      expect(article.content).toBeDefined();
    });

    it('ArticleImage interface works correctly', () => {
      const image: ArticleImage = {
        originalUrl: 'https://example.com/image.jpg',
        base64: 'data:image/jpeg;base64,abc123',
        alt: 'Test image',
      };

      expect(image.originalUrl).toBeDefined();
      expect(image.base64).toBeDefined();
      expect(image.alt).toBeDefined();
    });

    it('ApiResponse success type works', () => {
      const response: ApiResponse = {
        success: true,
        data: {
          url: 'https://medium.com/test',
          title: 'Test',
          author: 'Author',
          publishedDate: '2026-02-07',
          content: '<p>Content</p>',
          images: [],
        },
      };

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.title).toBe('Test');
      }
    });

    it('ApiResponse error type works', () => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Invalid URL',
        },
      };

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('INVALID_URL');
      }
    });
  });
});
