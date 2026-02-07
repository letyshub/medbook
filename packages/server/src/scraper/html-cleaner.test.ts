import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { cleanHtml, extractImages } from './html-cleaner.js';

describe('html-cleaner', () => {
  describe('cleanHtml', () => {
    it('removes navigation elements', () => {
      const html = `
        <article>
          <nav>Navigation</nav>
          <p>Content</p>
          <footer>Footer</footer>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).not.toContain('<nav>');
      expect(result).not.toContain('Navigation');
      expect(result).not.toContain('<footer>');
      expect(result).toContain('Content');
    });

    it('preserves headings and paragraphs', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <h2>Subtitle</h2>
          <p>Paragraph content</p>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).toContain('<h1>');
      expect(result).toContain('Title');
      expect(result).toContain('<h2>');
      expect(result).toContain('<p>');
    });

    it('preserves code blocks', () => {
      const html = `
        <article>
          <pre><code>const x = 1;</code></pre>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('preserves blockquotes', () => {
      const html = `
        <article>
          <blockquote>Famous quote here</blockquote>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).toContain('<blockquote>');
      expect(result).toContain('Famous quote here');
    });

    it('removes script and style tags', () => {
      const html = `
        <article>
          <script>alert('xss')</script>
          <style>.class { color: red; }</style>
          <p>Safe content</p>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('<style>');
      expect(result).toContain('Safe content');
    });

    it('removes social/share elements', () => {
      const html = `
        <article>
          <div class="share-buttons">Share</div>
          <div class="social-links">Follow</div>
          <p>Article content</p>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).not.toContain('Share');
      expect(result).not.toContain('Follow');
      expect(result).toContain('Article content');
    });

    it('returns empty string for missing container', () => {
      const html = '<div>No article here</div>';
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).toBe('');
    });

    it('cleans up whitespace', () => {
      const html = `
        <article>
          <p>  Content   with   spaces  </p>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).not.toContain('   ');
    });

    it('removes data-* attributes except data-testid', () => {
      const html = `
        <article>
          <div data-tracking="abc" data-testid="content">Text</div>
        </article>
      `;
      const $ = cheerio.load(html);
      const result = cleanHtml($, 'article');

      expect(result).not.toContain('data-tracking');
      expect(result).toContain('data-testid');
    });
  });

  describe('extractImages', () => {
    it('extracts image URLs', () => {
      const html = `
        <article>
          <img src="https://example.com/image1.jpg" alt="Image 1">
          <img src="https://example.com/image2.png" alt="Image 2">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images).toHaveLength(2);
      expect(images[0].url).toBe('https://example.com/image1.jpg');
      expect(images[0].alt).toBe('Image 1');
    });

    it('handles protocol-relative URLs', () => {
      const html = `
        <article>
          <img src="//example.com/image.jpg" alt="Test">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images[0].url).toBe('https://example.com/image.jpg');
    });

    it('extracts from data-src attribute', () => {
      const html = `
        <article>
          <img data-src="https://example.com/lazy.jpg" alt="Lazy image">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images).toHaveLength(1);
      expect(images[0].url).toBe('https://example.com/lazy.jpg');
    });

    it('deduplicates images', () => {
      const html = `
        <article>
          <img src="https://example.com/same.jpg" alt="First">
          <img src="https://example.com/same.jpg" alt="Duplicate">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images).toHaveLength(1);
    });

    it('ignores relative URLs without protocol', () => {
      const html = `
        <article>
          <img src="/images/local.jpg" alt="Local">
          <img src="relative/path.jpg" alt="Relative">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images).toHaveLength(0);
    });

    it('returns empty array when no images found', () => {
      const html = '<article><p>No images here</p></article>';
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images).toEqual([]);
    });

    it('handles missing alt attribute', () => {
      const html = `
        <article>
          <img src="https://example.com/noalt.jpg">
        </article>
      `;
      const $ = cheerio.load(html);
      const images = extractImages($, 'article');

      expect(images[0].alt).toBeUndefined();
    });
  });
});
