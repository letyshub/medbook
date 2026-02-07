/**
 * PDF Renderer using Puppeteer
 */

import puppeteer from 'puppeteer';
import { buildHtmlTemplate } from './html-template.js';
import type { Article, PdfOptions, ResolvedPdfOptions } from './types.js';
import { GeneratorException } from './types.js';
import {
  DEFAULT_OPTIONS,
  MAX_ARTICLES,
  MAX_CONTENT_SIZE_MB,
  RENDER_TIMEOUT_MS,
  PDF_MARGINS,
  ERROR_MESSAGES,
} from './constants.js';

/**
 * Merge user options with defaults
 */
function resolveOptions(options: PdfOptions): ResolvedPdfOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    author: options.author ?? DEFAULT_OPTIONS.author,
    pageSize: options.pageSize ?? DEFAULT_OPTIONS.pageSize,
    fontSize: options.fontSize ?? DEFAULT_OPTIONS.fontSize,
    includeImages: options.includeImages ?? DEFAULT_OPTIONS.includeImages,
  };
}

/**
 * Validate input articles and options
 */
function validateInput(articles: unknown, options: PdfOptions): void {
  if (!articles || !Array.isArray(articles)) {
    throw new GeneratorException('INVALID_INPUT', ERROR_MESSAGES.INVALID_INPUT);
  }

  if (articles.length === 0) {
    throw new GeneratorException('EMPTY_ARTICLES', ERROR_MESSAGES.EMPTY_ARTICLES);
  }

  if (articles.length > MAX_ARTICLES) {
    throw new GeneratorException('TOO_MANY_ARTICLES', ERROR_MESSAGES.TOO_MANY_ARTICLES);
  }

  if (!options?.title || typeof options.title !== 'string') {
    throw new GeneratorException('INVALID_INPUT', 'Title is required');
  }
}

/**
 * Check if content size exceeds limit
 */
function checkContentSize(html: string): void {
  const sizeBytes = Buffer.byteLength(html, 'utf8');
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > MAX_CONTENT_SIZE_MB) {
    throw new GeneratorException('CONTENT_TOO_LARGE', ERROR_MESSAGES.CONTENT_TOO_LARGE);
  }
}

/**
 * Generate a PDF from articles
 *
 * @param articles - Array of articles to include in the PDF
 * @param options - PDF generation options
 * @returns Buffer containing the generated PDF
 */
export async function generatePdf(
  articles: Article[],
  options: PdfOptions
): Promise<Buffer> {
  // Validate input
  validateInput(articles, options);

  // Merge with defaults
  const resolvedOptions = resolveOptions(options);

  // Build HTML template
  const html = buildHtmlTemplate(articles, resolvedOptions);

  // Check content size
  checkContentSize(html);

  // Render PDF with Puppeteer
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: resolvedOptions.pageSize,
      printBackground: true,
      margin: PDF_MARGINS,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      timeout: RENDER_TIMEOUT_MS,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    // Re-throw GeneratorException as-is
    if (error instanceof GeneratorException) {
      throw error;
    }

    // Check for timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new GeneratorException('TIMEOUT', ERROR_MESSAGES.TIMEOUT);
    }

    // Wrap other errors
    throw new GeneratorException('RENDER_ERROR', ERROR_MESSAGES.RENDER_ERROR);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
