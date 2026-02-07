/**
 * PDF Generator Constants
 */

import type { GeneratorErrorCode, PdfOptions } from './types.js';

// Limits
export const MAX_ARTICLES = 50;
export const MAX_CONTENT_SIZE_MB = 100;
export const RENDER_TIMEOUT_MS = 60000;

// Page dimensions
export const PAGE_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
} as const;

// Font stacks
export const FONTS = {
  heading: 'Arial, Helvetica, sans-serif',
  body: 'Georgia, "Times New Roman", serif',
  mono: '"Courier New", Courier, monospace',
} as const;

// Default options (excluding required 'title')
export const DEFAULT_OPTIONS: Required<Omit<PdfOptions, 'title'>> = {
  author: '',
  pageSize: 'A4',
  fontSize: 12,
  includeImages: true,
};

// Error messages
export const ERROR_MESSAGES: Record<GeneratorErrorCode, string> = {
  INVALID_INPUT: 'Invalid input: articles array and title are required',
  EMPTY_ARTICLES: 'At least one article is required',
  TOO_MANY_ARTICLES: `Maximum ${MAX_ARTICLES} articles allowed per request`,
  CONTENT_TOO_LARGE: `Total content exceeds ${MAX_CONTENT_SIZE_MB}MB limit`,
  RENDER_ERROR: 'Failed to render PDF',
  TIMEOUT: `PDF generation timed out after ${RENDER_TIMEOUT_MS / 1000} seconds`,
};

// PDF margins
export const PDF_MARGINS = {
  top: '20mm',
  right: '20mm',
  bottom: '20mm',
  left: '20mm',
} as const;
