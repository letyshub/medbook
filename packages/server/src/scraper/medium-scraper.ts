/**
 * Medium Article Scraper - Core scraping logic
 */

import * as cheerio from 'cheerio';
import { TIMEOUT_MS, MEDIUM_DOMAINS, CSS_SELECTORS, ERROR_MESSAGES } from './constants.js';
import { cleanHtml, extractImages } from './html-cleaner.js';
import { downloadAllImages } from './image-downloader.js';
import type { Article } from './types.js';
import { ScraperException } from './types.js';

/**
 * Checks if a hostname looks like a private/internal IP address
 * Blocks: localhost, 127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
 */
function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Block localhost variations
  if (lower === 'localhost' || lower === 'localhost.localdomain') {
    return true;
  }

  // Check for IP address patterns
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);

    // Loopback: 127.x.x.x
    if (a === 127) return true;

    // Private Class A: 10.x.x.x
    if (a === 10) return true;

    // Private Class B: 172.16.0.0 - 172.31.255.255
    if (a === 172 && b >= 16 && b <= 31) return true;

    // Private Class C: 192.168.x.x
    if (a === 192 && b === 168) return true;

    // Link-local: 169.254.x.x
    if (a === 169 && b === 254) return true;

    // Current network: 0.x.x.x
    if (a === 0) return true;
  }

  // Block IPv6 localhost
  if (lower === '::1' || lower === '[::1]') {
    return true;
  }

  return false;
}

/**
 * Validates that a URL is a Medium article URL
 */
function validateMediumUrl(url: string): void {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // SSRF Protection: Block private/internal IPs
    if (isPrivateHost(hostname)) {
      throw new ScraperException('INVALID_URL', 'Private or internal URLs are not allowed');
    }

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      throw new ScraperException('INVALID_URL', 'Only HTTPS URLs are allowed');
    }

    const isValidDomain = MEDIUM_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isValidDomain) {
      throw new ScraperException('INVALID_URL', ERROR_MESSAGES.INVALID_URL);
    }
  } catch (error) {
    if (error instanceof ScraperException) {
      throw error;
    }
    throw new ScraperException('INVALID_URL', ERROR_MESSAGES.INVALID_URL);
  }
}

/**
 * Fetches HTML content with timeout
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new ScraperException('NOT_FOUND', ERROR_MESSAGES.NOT_FOUND);
    }

    if (!response.ok) {
      throw new ScraperException('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ScraperException) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ScraperException('TIMEOUT', ERROR_MESSAGES.TIMEOUT);
    }

    throw new ScraperException('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Checks if the article is behind a paywall
 */
function checkPaywall($: cheerio.CheerioAPI): void {
  for (const selector of CSS_SELECTORS.paywall) {
    if ($(selector).length > 0) {
      throw new ScraperException('PAYWALL', ERROR_MESSAGES.PAYWALL);
    }
  }

  // Also check for "Member-only" text in the page
  const bodyText = $('body').text().toLowerCase();
  if (bodyText.includes('member-only story') || bodyText.includes('become a member')) {
    // Only throw if there's no actual content visible
    const articleContent = $('article').text().trim();
    if (articleContent.length < 500) {
      throw new ScraperException('PAYWALL', ERROR_MESSAGES.PAYWALL);
    }
  }
}

/**
 * Extracts text using multiple selectors (returns first match)
 */
function extractWithSelectors(
  $: cheerio.CheerioAPI,
  selectors: readonly string[]
): string | undefined {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      // For meta tags, get content attribute
      if (selector.startsWith('meta')) {
        const content = element.attr('content');
        if (content) return content.trim();
      } else {
        const text = element.text().trim();
        if (text) return text;
      }
    }
  }
  return undefined;
}

/**
 * Extracts article metadata
 */
function extractMetadata($: cheerio.CheerioAPI, url: string): Omit<Article, 'content' | 'images'> {
  // Extract title
  const title = extractWithSelectors($, CSS_SELECTORS.title);
  if (!title) {
    throw new ScraperException('PARSE_ERROR', 'Could not extract article title');
  }

  // Extract subtitle (optional)
  const subtitle = extractWithSelectors($, CSS_SELECTORS.subtitle);

  // Extract author
  const author = extractWithSelectors($, CSS_SELECTORS.author) || 'Unknown Author';

  // Extract published date
  let publishedDate = '';
  for (const selector of CSS_SELECTORS.publishedDate) {
    const element = $(selector).first();
    if (element.length > 0) {
      if (selector.includes('time')) {
        publishedDate = element.attr('datetime') || '';
      } else if (selector.startsWith('meta')) {
        publishedDate = element.attr('content') || '';
      }
      if (publishedDate) break;
    }
  }

  // If no date found, use current date
  if (!publishedDate) {
    publishedDate = new Date().toISOString();
  }

  // Extract reading time (optional)
  const readingTimeText = extractWithSelectors($, CSS_SELECTORS.readingTime);
  const readingTime = readingTimeText?.match(/\d+\s*min/)?.[0];

  // Extract tags
  const tags: string[] = [];
  const seenTags = new Set<string>();
  for (const selector of CSS_SELECTORS.tags) {
    $(selector).each((_, el) => {
      const tag = $(el).text().trim().toLowerCase();
      if (tag && !seenTags.has(tag) && tag.length < 50) {
        seenTags.add(tag);
        tags.push(tag);
      }
    });
  }

  return {
    url,
    title,
    subtitle,
    author,
    publishedDate,
    readingTime,
    tags: tags.length > 0 ? tags : undefined,
  };
}

/**
 * Main scraper function - scrapes a Medium article
 */
export async function scrapeArticle(url: string): Promise<Article> {
  // Validate URL
  validateMediumUrl(url);

  // Fetch HTML
  const html = await fetchHtml(url);

  // Parse HTML
  const $ = cheerio.load(html);

  // Check for paywall
  checkPaywall($);

  // Extract metadata
  const metadata = extractMetadata($, url);

  // Find content selector that works
  let contentSelector = 'article';
  for (const selector of CSS_SELECTORS.content) {
    if ($(selector).length > 0) {
      contentSelector = selector;
      break;
    }
  }

  // Extract and download images
  const imageData = extractImages($, contentSelector);
  const images = await downloadAllImages(imageData);

  // Clean HTML content
  const content = cleanHtml($, contentSelector);

  if (!content) {
    throw new ScraperException('PARSE_ERROR', ERROR_MESSAGES.PARSE_ERROR);
  }

  return {
    ...metadata,
    content,
    images,
  };
}
