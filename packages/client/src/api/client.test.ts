import { describe, it, expect, vi, beforeEach } from 'vitest';
import { previewUrls, convertToEbook, ApiException } from './client';
import type { ArticlePreview } from './types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('previewUrls', () => {
    it('parses success response correctly', async () => {
      const mockArticles: ArticlePreview[] = [
        {
          url: 'https://medium.com/article1',
          title: 'Test Article',
          author: 'Test Author',
          publishedDate: '2026-01-15',
          readingTime: '5 min read',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { articles: mockArticles },
        }),
      });

      const result = await previewUrls(['https://medium.com/article1']);

      expect(result).toEqual(mockArticles);
      expect(mockFetch).toHaveBeenCalledWith('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: ['https://medium.com/article1'] }),
      });
    });

    it('handles error responses (400, 429, 500)', async () => {
      // Test 429 rate limit error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' },
        }),
      });

      await expect(previewUrls(['https://medium.com/article1'])).rejects.toThrow(
        ApiException
      );

      try {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            success: false,
            error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' },
          }),
        });
        await previewUrls(['https://medium.com/article1']);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).code).toBe('RATE_LIMIT');
      }
    });
  });

  describe('convertToEbook', () => {
    it('returns blob on success', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await convertToEbook({
        urls: ['https://medium.com/article1'],
        format: 'pdf',
        options: { title: 'My eBook' },
      });

      expect(result).toEqual(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: ['https://medium.com/article1'],
          format: 'pdf',
          options: { title: 'My eBook' },
        }),
      });
    });

    it('handles error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Invalid input' },
        }),
      });

      await expect(
        convertToEbook({
          urls: [],
          format: 'pdf',
          options: { title: 'My eBook' },
        })
      ).rejects.toThrow(ApiException);

      try {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Invalid input' },
          }),
        });
        await convertToEbook({
          urls: [],
          format: 'pdf',
          options: { title: 'My eBook' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).code).toBe('INVALID_INPUT');
      }
    });
  });
});
