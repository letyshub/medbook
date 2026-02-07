import { describe, it, expect } from 'vitest';
import {
  MAX_ARTICLES,
  MAX_CONTENT_SIZE_MB,
  RENDER_TIMEOUT_MS,
  PAGE_SIZES,
  FONTS,
  DEFAULT_OPTIONS,
  ERROR_MESSAGES,
  PDF_MARGINS,
} from './constants.js';

describe('constants', () => {
  describe('limits', () => {
    it('MAX_ARTICLES is 50', () => {
      expect(MAX_ARTICLES).toBe(50);
    });

    it('MAX_CONTENT_SIZE_MB is 100', () => {
      expect(MAX_CONTENT_SIZE_MB).toBe(100);
    });

    it('RENDER_TIMEOUT_MS is 60 seconds', () => {
      expect(RENDER_TIMEOUT_MS).toBe(60000);
    });
  });

  describe('PAGE_SIZES', () => {
    it('has A4 dimensions', () => {
      expect(PAGE_SIZES.A4).toEqual({
        width: '210mm',
        height: '297mm',
      });
    });

    it('has Letter dimensions', () => {
      expect(PAGE_SIZES.Letter).toEqual({
        width: '8.5in',
        height: '11in',
      });
    });
  });

  describe('FONTS', () => {
    it('has heading font stack', () => {
      expect(FONTS.heading).toContain('Arial');
      expect(FONTS.heading).toContain('sans-serif');
    });

    it('has body font stack', () => {
      expect(FONTS.body).toContain('Georgia');
      expect(FONTS.body).toContain('serif');
    });

    it('has mono font stack', () => {
      expect(FONTS.mono).toContain('Courier');
      expect(FONTS.mono).toContain('monospace');
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('has A4 as default page size', () => {
      expect(DEFAULT_OPTIONS.pageSize).toBe('A4');
    });

    it('has 12 as default font size', () => {
      expect(DEFAULT_OPTIONS.fontSize).toBe(12);
    });

    it('includes images by default', () => {
      expect(DEFAULT_OPTIONS.includeImages).toBe(true);
    });

    it('has empty author by default', () => {
      expect(DEFAULT_OPTIONS.author).toBe('');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('has message for INVALID_INPUT', () => {
      expect(ERROR_MESSAGES.INVALID_INPUT).toBeDefined();
      expect(typeof ERROR_MESSAGES.INVALID_INPUT).toBe('string');
    });

    it('has message for EMPTY_ARTICLES', () => {
      expect(ERROR_MESSAGES.EMPTY_ARTICLES).toBeDefined();
    });

    it('has message for TOO_MANY_ARTICLES', () => {
      expect(ERROR_MESSAGES.TOO_MANY_ARTICLES).toContain('50');
    });

    it('has message for CONTENT_TOO_LARGE', () => {
      expect(ERROR_MESSAGES.CONTENT_TOO_LARGE).toContain('100');
    });

    it('has message for TIMEOUT', () => {
      expect(ERROR_MESSAGES.TIMEOUT).toContain('60');
    });

    it('has message for RENDER_ERROR', () => {
      expect(ERROR_MESSAGES.RENDER_ERROR).toBeDefined();
    });
  });

  describe('PDF_MARGINS', () => {
    it('has 20mm margins on all sides', () => {
      expect(PDF_MARGINS.top).toBe('20mm');
      expect(PDF_MARGINS.right).toBe('20mm');
      expect(PDF_MARGINS.bottom).toBe('20mm');
      expect(PDF_MARGINS.left).toBe('20mm');
    });
  });
});
