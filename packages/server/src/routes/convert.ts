/**
 * Convert API Routes - Combined scrape + generate workflow
 *
 * POST /convert - Scrape URLs and generate PDF/ePub
 * POST /preview - Scrape URLs and return metadata only
 */

import { Hono } from 'hono';
import { scrapeArticle, ScraperException } from '../scraper/index.js';
import { generatePdf, GeneratorException } from '../generators/pdf-generator/index.js';
import { generateEpub, EPUB_MIME_TYPE } from '../generators/epub-generator/index.js';
import type { Article } from '../scraper/index.js';

const router = new Hono();

// ==========================================
// Rate Limiting
// ==========================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Separate rate limiters for each endpoint
const convertRateLimiter = {
  maxRequests: 5,
  counts: new Map<string, { count: number; resetAt: number }>(),
};

const previewRateLimiter = {
  maxRequests: 10,
  counts: new Map<string, { count: number; resetAt: number }>(),
};

function checkRateLimit(
  ip: string,
  limiter: { maxRequests: number; counts: Map<string, { count: number; resetAt: number }> }
): boolean {
  const now = Date.now();
  const record = limiter.counts.get(ip);

  if (!record || now >= record.resetAt) {
    limiter.counts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= limiter.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const limiter of [convertRateLimiter, previewRateLimiter]) {
    for (const [ip, record] of limiter.counts.entries()) {
      if (now >= record.resetAt) {
        limiter.counts.delete(ip);
      }
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// Utilities
// ==========================================

/**
 * Sanitize filename for Content-Disposition header
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .slice(0, 100) || 'ebook';
}

/**
 * Get client IP from request
 */
function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Validate URLs array
 */
function validateUrls(urls: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(urls)) {
    return { valid: false, error: 'urls must be an array' };
  }
  if (urls.length === 0) {
    return { valid: false, error: 'urls array cannot be empty' };
  }
  if (urls.length > 10) {
    return { valid: false, error: 'Maximum 10 URLs allowed per request' };
  }
  for (const url of urls) {
    if (typeof url !== 'string' || !url.trim()) {
      return { valid: false, error: 'Each URL must be a non-empty string' };
    }
  }
  return { valid: true };
}

// ==========================================
// Error Response Helper
// ==========================================

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

function getHttpStatusForError(error: ScraperException | GeneratorException): number {
  const code = error.code;

  // Scraper error codes
  if (code === 'INVALID_URL') return 400;
  if (code === 'NOT_FOUND') return 404;
  if (code === 'PAYWALL') return 403;

  // Generator error codes
  if (code === 'INVALID_INPUT') return 400;
  if (code === 'EMPTY_ARTICLES') return 400;
  if (code === 'TOO_MANY_ARTICLES') return 400;
  if (code === 'CONTENT_TOO_LARGE') return 400;

  // Shared codes
  if (code === 'TIMEOUT') return 504;

  // Default to 500 for NETWORK_ERROR, PARSE_ERROR, RENDER_ERROR, etc.
  return 500;
}

// ==========================================
// POST /convert
// ==========================================

/**
 * POST /convert
 *
 * Scrape Medium articles and generate PDF or ePub.
 *
 * Request body:
 * {
 *   "urls": string[],
 *   "format": "pdf" | "epub",
 *   "options": { "title": string, "includeImages"?: boolean }
 * }
 *
 * Response: Binary file with Content-Type and Content-Disposition headers
 */
router.post('/convert', async (c) => {
  try {
    // Rate limiting check
    const clientIp = getClientIp(c);
    if (!checkRateLimit(clientIp, convertRateLimiter)) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please try again later.' },
      };
      return c.json(response, 429);
    }

    // Parse request body
    let body;
    try {
      body = await c.req.json();
    } catch {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
      };
      return c.json(response, 400);
    }

    const { urls, format, options } = body;

    // Validate URLs
    const urlValidation = validateUrls(urls);
    if (!urlValidation.valid) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: urlValidation.error! },
      };
      return c.json(response, 400);
    }

    // Validate format
    if (format !== 'pdf' && format !== 'epub') {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'format must be "pdf" or "epub"' },
      };
      return c.json(response, 400);
    }

    // Validate options.title
    if (!options?.title || typeof options.title !== 'string' || !options.title.trim()) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'options.title is required' },
      };
      return c.json(response, 400);
    }

    // Scrape all URLs sequentially
    const articles: Article[] = [];
    for (const url of urls as string[]) {
      const article = await scrapeArticle(url);
      articles.push(article);
    }

    // Generate output based on format
    const generatorOptions = {
      title: options.title,
      includeImages: options.includeImages !== false, // Default to true
    };

    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'pdf') {
      buffer = await generatePdf(articles, generatorOptions);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      buffer = await generateEpub(articles, generatorOptions);
      contentType = EPUB_MIME_TYPE;
      fileExtension = 'epub';
    }

    // Return binary response
    const filename = sanitizeFilename(options.title);
    const uint8Array = new Uint8Array(buffer);
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    // Handle ScraperException
    if (error instanceof ScraperException) {
      const response: ApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };
      return c.json(response, getHttpStatusForError(error));
    }

    // Handle GeneratorException
    if (error instanceof GeneratorException) {
      const response: ApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };
      return c.json(response, getHttpStatusForError(error));
    }

    // Handle unexpected errors
    console.error('Unexpected error in /convert:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'An unexpected error occurred' },
    };
    return c.json(response, 500);
  }
});

// ==========================================
// POST /preview
// ==========================================

/**
 * POST /preview
 *
 * Scrape Medium articles and return metadata only (no file generation).
 *
 * Request body:
 * {
 *   "urls": string[]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "articles": [{ url, title, author, publishedDate, readingTime }]
 *   }
 * }
 */
router.post('/preview', async (c) => {
  try {
    // Rate limiting check
    const clientIp = getClientIp(c);
    if (!checkRateLimit(clientIp, previewRateLimiter)) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please try again later.' },
      };
      return c.json(response, 429);
    }

    // Parse request body
    let body;
    try {
      body = await c.req.json();
    } catch {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
      };
      return c.json(response, 400);
    }

    const { urls } = body;

    // Validate URLs
    const urlValidation = validateUrls(urls);
    if (!urlValidation.valid) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: urlValidation.error! },
      };
      return c.json(response, 400);
    }

    // Scrape all URLs and extract metadata only
    const articles = [];
    for (const url of urls as string[]) {
      const article = await scrapeArticle(url);
      // Return only metadata fields (no content, images, tags, subtitle)
      articles.push({
        url: article.url,
        title: article.title,
        author: article.author,
        publishedDate: article.publishedDate,
        readingTime: article.readingTime,
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { articles },
    };
    return c.json(response);
  } catch (error) {
    // Handle ScraperException
    if (error instanceof ScraperException) {
      const response: ApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };
      return c.json(response, getHttpStatusForError(error));
    }

    // Handle unexpected errors
    console.error('Unexpected error in /preview:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'An unexpected error occurred' },
    };
    return c.json(response, 500);
  }
});

export default router;
