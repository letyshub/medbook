import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  escapeHtml,
  escapeRegExp,
  buildTitlePage,
  buildTableOfContents,
  buildArticlePage,
  getStyles,
  buildHtmlTemplate,
} from './html-template.js';
import type { Article, ResolvedPdfOptions } from './types.js';

describe('html-template', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('escapes ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      expect(escapeHtml('He said "hello"')).toContain('&quot;');
      expect(escapeHtml("It's fine")).toContain('&#039;');
    });

    it('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('escapeRegExp', () => {
    it('escapes regex special characters', () => {
      const input = 'test.*+?^${}()|[]\\';
      const result = escapeRegExp(input);

      expect(result).not.toBe(input);
      expect(result).toContain('\\.');
      expect(result).toContain('\\*');
    });

    it('preserves normal characters', () => {
      expect(escapeRegExp('hello')).toBe('hello');
    });
  });

  describe('buildTitlePage', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-07'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders title', () => {
      const result = buildTitlePage({ title: 'My eBook', author: '' });

      expect(result).toContain('My eBook');
      expect(result).toContain('class="book-title"');
    });

    it('renders author when provided', () => {
      const result = buildTitlePage({
        title: 'My eBook',
        author: 'John Doe',
      });

      expect(result).toContain('John Doe');
      expect(result).toContain('class="book-author"');
    });

    it('omits author section when empty', () => {
      const result = buildTitlePage({ title: 'My eBook', author: '' });

      expect(result).not.toContain('class="book-author"');
    });

    it('includes generation date', () => {
      const result = buildTitlePage({ title: 'Test', author: '' });

      expect(result).toContain('Generated on');
      expect(result).toContain('February');
      expect(result).toContain('2026');
    });

    it('escapes HTML in title and author', () => {
      const result = buildTitlePage({
        title: '<script>evil</script>',
        author: '<img onerror="xss">',
      });

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<img');
    });
  });

  describe('buildTableOfContents', () => {
    it('renders article titles', () => {
      const articles: Article[] = [
        {
          url: 'https://example.com/1',
          title: 'Article One',
          author: 'Author A',
          publishedDate: '2026-01-01',
          content: '<p>Content</p>',
          images: [],
        },
        {
          url: 'https://example.com/2',
          title: 'Article Two',
          author: 'Author B',
          publishedDate: '2026-01-02',
          content: '<p>Content</p>',
          images: [],
        },
      ];

      const result = buildTableOfContents(articles);

      expect(result).toContain('Article One');
      expect(result).toContain('Article Two');
      expect(result).toContain('Author A');
      expect(result).toContain('Author B');
    });

    it('includes links to articles', () => {
      const articles: Article[] = [
        {
          url: 'https://example.com/1',
          title: 'Test',
          author: 'Author',
          publishedDate: '2026-01-01',
          content: '<p>Content</p>',
          images: [],
        },
      ];

      const result = buildTableOfContents(articles);

      expect(result).toContain('href="#article-0"');
    });

    it('escapes HTML in titles and authors', () => {
      const articles: Article[] = [
        {
          url: 'https://example.com/1',
          title: '<script>bad</script>',
          author: '<img src=x>',
          publishedDate: '2026-01-01',
          content: '<p>Content</p>',
          images: [],
        },
      ];

      const result = buildTableOfContents(articles);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<img');
    });
  });

  describe('buildArticlePage', () => {
    const baseArticle: Article = {
      url: 'https://example.com/article',
      title: 'Test Article',
      author: 'Test Author',
      publishedDate: '2026-02-07',
      content: '<p>Article content here</p>',
      images: [],
    };

    it('renders article title and metadata', () => {
      const result = buildArticlePage(baseArticle, 0, { includeImages: true });

      expect(result).toContain('Test Article');
      expect(result).toContain('Test Author');
      expect(result).toContain('2026-02-07');
    });

    it('includes article content', () => {
      const result = buildArticlePage(baseArticle, 0, { includeImages: true });

      expect(result).toContain('Article content here');
    });

    it('sets correct article ID', () => {
      const result0 = buildArticlePage(baseArticle, 0, { includeImages: true });
      const result5 = buildArticlePage(baseArticle, 5, { includeImages: true });

      expect(result0).toContain('id="article-0"');
      expect(result5).toContain('id="article-5"');
    });

    it('removes images when includeImages is false', () => {
      const articleWithImage: Article = {
        ...baseArticle,
        content: '<p>Before</p><img src="test.jpg" alt="test"><p>After</p>',
      };

      const result = buildArticlePage(articleWithImage, 0, {
        includeImages: false,
      });

      expect(result).not.toContain('<img');
      expect(result).toContain('Before');
      expect(result).toContain('After');
    });

    it('replaces image URLs with base64 when available', () => {
      const articleWithImage: Article = {
        ...baseArticle,
        content: '<img src="https://example.com/image.jpg" alt="test">',
        images: [
          {
            originalUrl: 'https://example.com/image.jpg',
            base64: 'data:image/jpeg;base64,abc123',
            alt: 'test',
          },
        ],
      };

      const result = buildArticlePage(articleWithImage, 0, {
        includeImages: true,
      });

      expect(result).toContain('data:image/jpeg;base64,abc123');
      expect(result).not.toContain('https://example.com/image.jpg');
    });

    it('escapes HTML in title, author, and date', () => {
      const xssArticle: Article = {
        ...baseArticle,
        title: '<script>bad</script>',
        author: '<img onerror=xss>',
        publishedDate: '<b>2026</b>',
      };

      const result = buildArticlePage(xssArticle, 0, { includeImages: true });

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<img onerror');
      // Note: content is NOT escaped (it's trusted HTML from scraper)
    });
  });

  describe('getStyles', () => {
    it('includes font size', () => {
      const result = getStyles({ fontSize: 14 });

      expect(result).toContain('14pt');
    });

    it('includes font stacks', () => {
      const result = getStyles({ fontSize: 12 });

      expect(result).toContain('Georgia');
      expect(result).toContain('Arial');
      expect(result).toContain('Courier');
    });

    it('includes page break styles', () => {
      const result = getStyles({ fontSize: 12 });

      expect(result).toContain('page-break-after');
      expect(result).toContain('page-break-before');
    });
  });

  describe('buildHtmlTemplate', () => {
    const articles: Article[] = [
      {
        url: 'https://example.com/1',
        title: 'Article One',
        author: 'Author A',
        publishedDate: '2026-01-01',
        content: '<p>Content one</p>',
        images: [],
      },
    ];

    const options: ResolvedPdfOptions = {
      title: 'My eBook',
      author: 'John Doe',
      pageSize: 'A4',
      fontSize: 12,
      includeImages: true,
    };

    it('produces valid HTML document', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<body>');
    });

    it('includes title page', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('My eBook');
      expect(result).toContain('John Doe');
      expect(result).toContain('class="title-page"');
    });

    it('includes table of contents', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('Table of Contents');
      expect(result).toContain('Article One');
    });

    it('includes articles', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('Content one');
      expect(result).toContain('class="article-page"');
    });

    it('includes styles', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('<style>');
      expect(result).toContain('font-family');
    });

    it('sets document title', () => {
      const result = buildHtmlTemplate(articles, options);

      expect(result).toContain('<title>My eBook</title>');
    });
  });
});
