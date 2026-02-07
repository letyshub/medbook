/**
 * HTML Cleaner - Sanitizes and cleans article HTML
 */

import type { CheerioAPI } from 'cheerio';
import { ELEMENTS_TO_REMOVE } from './constants.js';

/**
 * Removes unwanted elements from the HTML
 */
function removeUnwantedElements($: CheerioAPI, container: ReturnType<CheerioAPI>): void {
  // Remove elements by selector
  for (const selector of ELEMENTS_TO_REMOVE) {
    container.find(selector).remove();
  }

  // Remove empty elements (except self-closing tags)
  container.find('*').each((_, el) => {
    const $el = $(el);
    const tagName = el.type === 'tag' ? el.name.toLowerCase() : '';

    // Skip self-closing or media elements
    if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
      return;
    }

    // Remove if empty (no text and no meaningful children)
    if ($el.text().trim() === '' && $el.find('img').length === 0) {
      $el.remove();
    }
  });
}

/**
 * Cleans data attributes and tracking elements
 */
function cleanAttributes($: CheerioAPI, container: ReturnType<CheerioAPI>): void {
  container.find('*').each((_, el) => {
    const $el = $(el);
    const attributes = el.type === 'tag' ? el.attribs : {};

    // Remove data-* attributes (except data-testid for debugging)
    for (const attr of Object.keys(attributes)) {
      if (attr.startsWith('data-') && attr !== 'data-testid') {
        $el.removeAttr(attr);
      }
      // Remove tracking/analytics attributes
      if (attr.startsWith('aria-') || attr.startsWith('on')) {
        $el.removeAttr(attr);
      }
    }

    // Keep only essential attributes on links
    if (el.type === 'tag' && el.name === 'a') {
      const href = $el.attr('href');
      const allowedAttrs = ['href', 'title'];
      for (const attr of Object.keys(attributes)) {
        if (!allowedAttrs.includes(attr)) {
          $el.removeAttr(attr);
        }
      }
      if (href) {
        $el.attr('href', href);
      }
    }

    // Keep only essential attributes on images
    if (el.type === 'tag' && el.name === 'img') {
      const src = $el.attr('src') || $el.attr('data-src');
      const alt = $el.attr('alt');
      const allowedAttrs = ['src', 'alt'];
      for (const attr of Object.keys(attributes)) {
        if (!allowedAttrs.includes(attr)) {
          $el.removeAttr(attr);
        }
      }
      if (src) {
        $el.attr('src', src);
      }
      if (alt) {
        $el.attr('alt', alt);
      }
    }
  });
}

/**
 * Cleans and sanitizes HTML content
 * @param $ - Cheerio instance
 * @param contentSelector - Selector for the content container
 * @returns Cleaned HTML string
 */
export function cleanHtml($: CheerioAPI, contentSelector: string = 'article'): string {
  // Clone the content to avoid modifying the original
  const container = $(contentSelector).clone();

  if (container.length === 0) {
    return '';
  }

  // Remove unwanted elements
  removeUnwantedElements($, container);

  // Clean attributes
  cleanAttributes($, container);

  // Get the cleaned HTML
  const html = container.html() || '';

  // Clean up whitespace
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Extracts image URLs from the content
 * @param $ - Cheerio instance
 * @param contentSelector - Selector for the content container
 * @returns Array of image data with URLs and alt text
 */
export function extractImages(
  $: CheerioAPI,
  contentSelector: string = 'article'
): Array<{ url: string; alt?: string }> {
  const images: Array<{ url: string; alt?: string }> = [];
  const seen = new Set<string>();

  $(contentSelector)
    .find('img')
    .each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');
      const alt = $img.attr('alt');

      if (src && !seen.has(src)) {
        seen.add(src);
        // Only include absolute URLs or Medium CDN URLs
        if (src.startsWith('http') || src.startsWith('//')) {
          const url = src.startsWith('//') ? `https:${src}` : src;
          images.push({ url, alt: alt || undefined });
        }
      }
    });

  return images;
}
