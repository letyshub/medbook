import { describe, it, expect } from 'vitest';
import {
  TIMEOUT_MS,
  MEDIUM_DOMAINS,
  CSS_SELECTORS,
  ELEMENTS_TO_REMOVE,
  ELEMENTS_TO_PRESERVE,
  ERROR_MESSAGES,
} from './constants.js';

describe('constants', () => {
  describe('TIMEOUT_MS', () => {
    it('is set to 30 seconds', () => {
      expect(TIMEOUT_MS).toBe(30000);
    });
  });

  describe('MEDIUM_DOMAINS', () => {
    it('includes medium.com', () => {
      expect(MEDIUM_DOMAINS).toContain('medium.com');
    });

    it('includes popular Medium publications', () => {
      expect(MEDIUM_DOMAINS).toContain('towardsdatascience.com');
      expect(MEDIUM_DOMAINS).toContain('betterprogramming.pub');
    });

    it('is an array with at least one domain', () => {
      expect(Array.isArray(MEDIUM_DOMAINS)).toBe(true);
      expect(MEDIUM_DOMAINS.length).toBeGreaterThan(0);
    });
  });

  describe('CSS_SELECTORS', () => {
    it('has title selectors', () => {
      expect(CSS_SELECTORS.title).toBeDefined();
      expect(Array.isArray(CSS_SELECTORS.title)).toBe(true);
    });

    it('has author selectors', () => {
      expect(CSS_SELECTORS.author).toBeDefined();
    });

    it('has content selectors', () => {
      expect(CSS_SELECTORS.content).toBeDefined();
    });

    it('has paywall selectors', () => {
      expect(CSS_SELECTORS.paywall).toBeDefined();
    });
  });

  describe('ELEMENTS_TO_REMOVE', () => {
    it('includes navigation elements', () => {
      expect(ELEMENTS_TO_REMOVE).toContain('nav');
      expect(ELEMENTS_TO_REMOVE).toContain('header');
      expect(ELEMENTS_TO_REMOVE).toContain('footer');
    });

    it('includes script and style tags', () => {
      expect(ELEMENTS_TO_REMOVE).toContain('script');
      expect(ELEMENTS_TO_REMOVE).toContain('style');
    });

    it('includes social/share elements', () => {
      expect(ELEMENTS_TO_REMOVE).toContain('[class*="share"]');
      expect(ELEMENTS_TO_REMOVE).toContain('[class*="social"]');
    });
  });

  describe('ELEMENTS_TO_PRESERVE', () => {
    it('includes heading elements', () => {
      expect(ELEMENTS_TO_PRESERVE).toContain('h1');
      expect(ELEMENTS_TO_PRESERVE).toContain('h2');
      expect(ELEMENTS_TO_PRESERVE).toContain('h3');
    });

    it('includes paragraph and text elements', () => {
      expect(ELEMENTS_TO_PRESERVE).toContain('p');
      expect(ELEMENTS_TO_PRESERVE).toContain('strong');
      expect(ELEMENTS_TO_PRESERVE).toContain('em');
    });

    it('includes code elements', () => {
      expect(ELEMENTS_TO_PRESERVE).toContain('pre');
      expect(ELEMENTS_TO_PRESERVE).toContain('code');
    });

    it('includes list elements', () => {
      expect(ELEMENTS_TO_PRESERVE).toContain('ul');
      expect(ELEMENTS_TO_PRESERVE).toContain('ol');
      expect(ELEMENTS_TO_PRESERVE).toContain('li');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('has message for INVALID_URL', () => {
      expect(ERROR_MESSAGES.INVALID_URL).toBeDefined();
      expect(typeof ERROR_MESSAGES.INVALID_URL).toBe('string');
    });

    it('has message for TIMEOUT', () => {
      expect(ERROR_MESSAGES.TIMEOUT).toBeDefined();
      expect(ERROR_MESSAGES.TIMEOUT).toContain('30');
    });

    it('has message for all error codes', () => {
      expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.PAYWALL).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.PARSE_ERROR).toBeDefined();
    });
  });
});
