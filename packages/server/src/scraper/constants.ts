/**
 * Medium Article Scraper Constants
 */

import type { ErrorCode } from './types.js';

// Timeout for HTTP requests (30 seconds)
export const TIMEOUT_MS = 30000;

// Valid Medium domains (including popular publications with custom domains)
export const MEDIUM_DOMAINS = [
  // Main Medium domain
  'medium.com',

  // Popular Medium publications with custom domains
  'towardsdatascience.com',
  'betterprogramming.pub',
  'levelup.gitconnected.com',
  'javascript.plainenglish.io',
  'blog.devgenius.io',
  'uxdesign.cc',
  'betterhumans.pub',
  'entrepreneurshandbook.co',
  'writingcooperative.com',
  'psiloveyou.xyz',
  'codeburst.io',
  'hackernoon.com',
  'itnext.io',
  'blog.bitsrc.io',
  'bootcamp.uxdesign.cc',
];

// CSS selectors for Medium article elements
export const CSS_SELECTORS = {
  // Article container
  article: 'article',

  // Title selectors (try in order)
  title: ['h1', '[data-testid="storyTitle"]'],

  // Subtitle/description
  subtitle: ['h2', '[data-testid="storySubtitle"]', 'meta[name="description"]'],

  // Author
  author: ['[data-testid="authorName"]', 'meta[name="author"]', '[rel="author"]'],

  // Published date
  publishedDate: ['time[datetime]', 'meta[property="article:published_time"]'],

  // Reading time
  readingTime: ['[data-testid="storyReadTime"]'],

  // Tags
  tags: ['[data-testid="tag"]', 'a[href*="/tag/"]'],

  // Content area
  content: ['article section', '[data-field="body"]', 'article'],

  // Paywall indicators
  paywall: ['[data-testid="paywall"]', '.meteredContent', '[id*="paywall"]'],
} as const;

// Elements to remove from cleaned HTML
export const ELEMENTS_TO_REMOVE = [
  'nav',
  'header',
  'footer',
  'aside',
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'button',
  'form',
  'input',
  '[data-testid="headerNav"]',
  '[data-testid="footerNav"]',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[class*="share"]',
  '[class*="social"]',
  '[class*="comment"]',
  '[class*="related"]',
  '[class*="recommend"]',
  '[class*="follow"]',
  '[class*="subscribe"]',
  '[class*="newsletter"]',
  '[class*="ad-"]',
  '[class*="ads-"]',
  '[class*="promo"]',
] as const;

// Elements to preserve in cleaned HTML
export const ELEMENTS_TO_PRESERVE = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'strong',
  'b',
  'em',
  'i',
  'a',
  'pre',
  'code',
  'blockquote',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'img',
  'br',
  'hr',
  'span',
  'div',
] as const;

// Error messages for each error code
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_URL: 'The provided URL is not a valid Medium article URL',
  TIMEOUT: 'Request timed out after 30 seconds',
  NOT_FOUND: 'Article not found',
  PAYWALL: "This article is behind Medium's paywall",
  NETWORK_ERROR: 'Failed to fetch the article due to a network error',
  PARSE_ERROR: 'Failed to parse the article content',
};
