/**
 * Scraper API Route - POST /api/scrape
 */

import { Hono } from 'hono';
import { scrapeArticle, ScraperException } from '../scraper/index.js';
import type { ApiResponse } from '../scraper/index.js';

/**
 * Simple in-memory rate limiter
 * Limits: 10 requests per minute per IP
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now >= record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now >= record.resetAt) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const router = new Hono();

/**
 * POST /scrape - Scrapes a Medium article
 *
 * Request body: { url: string }
 * Response: { success: true, data: Article } or { success: false, error: { code, message } }
 */
router.post('/scrape', async (c) => {
  try {
    // Rate limiting check
    const clientIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Rate limit exceeded. Please try again later.',
        },
      };
      return c.json(response, 429);
    }

    // Parse request body
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body.url !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Request body must contain a valid "url" string',
        },
      };
      return c.json(response, 400);
    }

    const { url } = body;

    // Validate URL is not empty
    if (!url.trim()) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL cannot be empty',
        },
      };
      return c.json(response, 400);
    }

    // Scrape the article
    const article = await scrapeArticle(url);

    // Return success response
    const response: ApiResponse = {
      success: true,
      data: article,
    };

    return c.json(response);
  } catch (error) {
    // Handle scraper errors
    if (error instanceof ScraperException) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };

      // Return with appropriate HTTP status code
      switch (error.code) {
        case 'INVALID_URL':
          return c.json(response, 400);
        case 'NOT_FOUND':
          return c.json(response, 404);
        case 'PAYWALL':
          return c.json(response, 403);
        case 'TIMEOUT':
          return c.json(response, 504);
        default:
          return c.json(response, 500);
      }
    }

    // Handle unexpected errors
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    return c.json(response, 500);
  }
});

export default router;
