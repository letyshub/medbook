/**
 * Generator API Routes (PDF and ePub)
 */

import { Hono } from 'hono';
import { generatePdf, GeneratorException } from '../generators/pdf-generator/index.js';
import { generateEpub, EPUB_MIME_TYPE } from '../generators/epub-generator/index.js';
import type { GeneratorApiResponse } from '../generators/pdf-generator/index.js';

const router = new Hono();

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
 * POST /generate-pdf
 *
 * Generate a PDF from articles.
 *
 * Request body:
 * {
 *   "articles": Article[],
 *   "options": { "title": string, "author"?: string, ... }
 * }
 *
 * Response: Binary PDF with Content-Type: application/pdf
 */
router.post('/generate-pdf', async (c) => {
  try {
    // Parse request body
    let body;
    try {
      body = await c.req.json();
    } catch {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
      };
      return c.json(response, 400);
    }

    const { articles, options } = body;

    // Validate title is present
    if (!options?.title) {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Title is required in options' },
      };
      return c.json(response, 400);
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(articles, options);

    // Set response headers and return PDF
    const filename = sanitizeFilename(options.title);
    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer);
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Handle GeneratorException
    if (error instanceof GeneratorException) {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };

      // Return with appropriate HTTP status code
      switch (error.code) {
        case 'INVALID_INPUT':
        case 'EMPTY_ARTICLES':
        case 'TOO_MANY_ARTICLES':
        case 'CONTENT_TOO_LARGE':
          return c.json(response, 400);
        case 'TIMEOUT':
          return c.json(response, 504);
        default:
          return c.json(response, 500);
      }
    }

    // Handle unexpected errors
    console.error('Unexpected error in PDF generation:', error);
    const response: GeneratorApiResponse = {
      success: false,
      error: { code: 'RENDER_ERROR', message: 'An unexpected error occurred' },
    };
    return c.json(response, 500);
  }
});

/**
 * POST /generate-epub
 *
 * Generate an ePub from articles.
 *
 * Request body:
 * {
 *   "articles": Article[],
 *   "options": { "title": string, "author"?: string, "language"?: string, ... }
 * }
 *
 * Response: Binary ePub with Content-Type: application/epub+zip
 */
router.post('/generate-epub', async (c) => {
  try {
    // Parse request body
    let body;
    try {
      body = await c.req.json();
    } catch {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
      };
      return c.json(response, 400);
    }

    const { articles, options } = body;

    // Validate title is present
    if (!options?.title) {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Title is required in options' },
      };
      return c.json(response, 400);
    }

    // Generate ePub
    const epubBuffer = await generateEpub(articles, options);

    // Set response headers and return ePub
    const filename = sanitizeFilename(options.title);
    const uint8Array = new Uint8Array(epubBuffer);
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': EPUB_MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}.epub"`,
        'Content-Length': epubBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Handle GeneratorException
    if (error instanceof GeneratorException) {
      const response: GeneratorApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };

      // Return with appropriate HTTP status code
      switch (error.code) {
        case 'INVALID_INPUT':
        case 'EMPTY_ARTICLES':
        case 'TOO_MANY_ARTICLES':
        case 'CONTENT_TOO_LARGE':
          return c.json(response, 400);
        case 'TIMEOUT':
          return c.json(response, 504);
        default:
          return c.json(response, 500);
      }
    }

    // Handle unexpected errors
    console.error('Unexpected error in ePub generation:', error);
    const response: GeneratorApiResponse = {
      success: false,
      error: { code: 'RENDER_ERROR', message: 'An unexpected error occurred' },
    };
    return c.json(response, 500);
  }
});

export default router;
