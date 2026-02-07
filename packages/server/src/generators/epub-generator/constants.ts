/**
 * ePub Generator Constants
 */

import type { GeneratorErrorCode } from '../pdf-generator/types.js';
import type { EpubOptions } from './types.js';

// Limits (same as PDF generator)
export const MAX_ARTICLES = 50;
export const MAX_CONTENT_SIZE_MB = 100;
export const RENDER_TIMEOUT_MS = 60000;

// ePub MIME type
export const EPUB_MIME_TYPE = 'application/epub+zip';

// Default options (excluding required 'title')
export const DEFAULT_OPTIONS: Required<Omit<EpubOptions, 'title'>> = {
  author: '',
  language: 'en',
  cover: '',
  includeImages: true,
};

// Error messages
export const ERROR_MESSAGES: Record<GeneratorErrorCode, string> = {
  INVALID_INPUT: 'Invalid input: articles array and title are required',
  EMPTY_ARTICLES: 'At least one article is required',
  TOO_MANY_ARTICLES: `Maximum ${MAX_ARTICLES} articles allowed per request`,
  CONTENT_TOO_LARGE: `Total content exceeds ${MAX_CONTENT_SIZE_MB}MB limit`,
  RENDER_ERROR: 'Failed to render ePub',
  TIMEOUT: `ePub generation timed out after ${RENDER_TIMEOUT_MS / 1000} seconds`,
};
