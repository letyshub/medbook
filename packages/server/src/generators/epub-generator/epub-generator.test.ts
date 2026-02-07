/**
 * ePub Generator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Article } from './types.js';

// Mock epub-gen-memory
vi.mock('epub-gen-memory', () => ({
  default: vi.fn().mockResolvedValue(Buffer.from('mock-epub-content')),
}));

// Import after mock
import { generateEpub, validateInput, resolveOptions, checkContentSize } from './epub-renderer.js';
import { buildChapterContent, buildChapters } from './epub-builder.js';
import { DEFAULT_OPTIONS, ERROR_MESSAGES, MAX_ARTICLES } from './constants.js';
import { GeneratorException } from './types.js';

// Mock article for testing
const mockArticle: Article = {
  url: 'https://example.com/article',
  title: 'Test Article',
  author: 'Test Author',
  publishedDate: '2026-02-07',
  content: '<p>Test content</p>',
  images: [],
};

const mockArticleWithImages: Article = {
  ...mockArticle,
  images: [
    {
      originalUrl: 'https://example.com/image.jpg',
      base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      alt: 'Test image',
    },
  ],
  content: '<p>Test content</p><img src="https://example.com/image.jpg" alt="Test image">',
};

describe('epub-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group 1: Types and Constants Tests
  describe('types and constants', () => {
    it('should have correct DEFAULT_OPTIONS values', () => {
      expect(DEFAULT_OPTIONS.author).toBe('');
      expect(DEFAULT_OPTIONS.language).toBe('en');
      expect(DEFAULT_OPTIONS.includeImages).toBe(true);
      expect(DEFAULT_OPTIONS.cover).toBe('');
    });

    it('should have ERROR_MESSAGES for all error codes', () => {
      expect(ERROR_MESSAGES.INVALID_INPUT).toBeDefined();
      expect(ERROR_MESSAGES.EMPTY_ARTICLES).toBeDefined();
      expect(ERROR_MESSAGES.TOO_MANY_ARTICLES).toBeDefined();
      expect(ERROR_MESSAGES.CONTENT_TOO_LARGE).toBeDefined();
      expect(ERROR_MESSAGES.RENDER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.TIMEOUT).toBeDefined();
    });

    it('should have MAX_ARTICLES set to 50', () => {
      expect(MAX_ARTICLES).toBe(50);
    });
  });

  // Group 2: Validation Tests
  describe('validateInput', () => {
    it('should reject empty articles array', () => {
      expect(() => validateInput([], { title: 'Test' })).toThrow(GeneratorException);
      expect(() => validateInput([], { title: 'Test' })).toThrow('At least one article');
    });

    it('should reject too many articles (>50)', () => {
      const manyArticles = Array(51).fill(mockArticle);
      expect(() => validateInput(manyArticles, { title: 'Test' })).toThrow(GeneratorException);
      expect(() => validateInput(manyArticles, { title: 'Test' })).toThrow('Maximum 50');
    });

    it('should reject non-array input', () => {
      expect(() => validateInput(null, { title: 'Test' })).toThrow(GeneratorException);
      expect(() => validateInput('not an array', { title: 'Test' })).toThrow(GeneratorException);
    });

    it('should reject missing title', () => {
      expect(() => validateInput([mockArticle], {} as any)).toThrow(GeneratorException);
      expect(() => validateInput([mockArticle], { title: '' })).toThrow('Title is required');
    });
  });

  describe('resolveOptions', () => {
    it('should apply defaults for missing optional fields', () => {
      const result = resolveOptions({ title: 'Test Book' });
      expect(result.title).toBe('Test Book');
      expect(result.author).toBe('');
      expect(result.language).toBe('en');
      expect(result.includeImages).toBe(true);
      expect(result.cover).toBe('');
    });

    it('should preserve provided values', () => {
      const result = resolveOptions({
        title: 'My Book',
        author: 'John Doe',
        language: 'pl',
        includeImages: false,
        cover: 'data:image/png;base64,abc',
      });
      expect(result.title).toBe('My Book');
      expect(result.author).toBe('John Doe');
      expect(result.language).toBe('pl');
      expect(result.includeImages).toBe(false);
      expect(result.cover).toBe('data:image/png;base64,abc');
    });
  });

  describe('checkContentSize', () => {
    it('should accept normal content size', () => {
      expect(() => checkContentSize([mockArticle])).not.toThrow();
    });

    it('should reject oversized content', () => {
      // Create article with >100MB content
      const largeContent = 'x'.repeat(101 * 1024 * 1024);
      const largeArticle: Article = { ...mockArticle, content: largeContent };
      expect(() => checkContentSize([largeArticle])).toThrow(GeneratorException);
      expect(() => checkContentSize([largeArticle])).toThrow('exceeds');
    });
  });

  // Group 2: Builder Tests
  describe('buildChapterContent', () => {
    it('should build chapter with article metadata', () => {
      const content = buildChapterContent(mockArticle, true);
      expect(content).toContain('Test Article');
      expect(content).toContain('Test Author');
      expect(content).toContain('Test content');
    });

    it('should remove images when includeImages is false', () => {
      const content = buildChapterContent(mockArticleWithImages, false);
      expect(content).not.toContain('<img');
    });

    it('should include images when includeImages is true', () => {
      const content = buildChapterContent(mockArticleWithImages, true);
      expect(content).toContain('base64');
    });
  });

  describe('buildChapters', () => {
    it('should return array of chapters with title and content', () => {
      const chapters = buildChapters([mockArticle], true);
      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Test Article');
      expect(chapters[0].content).toContain('Test Author');
    });
  });

  // Group 2: Main Function Tests
  describe('generateEpub', () => {
    it('should return Buffer on success', async () => {
      const result = await generateEpub([mockArticle], { title: 'Test Book' });
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw GeneratorException on validation error', async () => {
      await expect(generateEpub([], { title: 'Test' })).rejects.toThrow(GeneratorException);
    });
  });

  // Group 4: Additional Edge Case Tests
  describe('edge cases', () => {
    it('should handle articles with special characters in title', () => {
      const articleWithSpecialChars: Article = {
        ...mockArticle,
        title: 'Test <script>alert("xss")</script> & more',
      };
      const content = buildChapterContent(articleWithSpecialChars, true);
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    });

    it('should handle maximum number of articles (50)', async () => {
      const fiftyArticles = Array(50).fill(mockArticle);
      const result = await generateEpub(fiftyArticles, { title: 'Big Book' });
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle cover image option', async () => {
      const epub = (await import('epub-gen-memory')).default;
      await generateEpub([mockArticle], {
        title: 'Book with Cover',
        cover: 'data:image/png;base64,iVBORw0KGgo=',
      });
      // epub() is called with (options, chapters) - two arguments
      expect(epub).toHaveBeenCalledWith(
        expect.objectContaining({
          cover: 'data:image/png;base64,iVBORw0KGgo=',
        }),
        expect.any(Array)
      );
    });
  });
});
