/**
 * Medium Article Scraper - Public API
 */

// Types
export type {
  Article,
  ArticleImage,
  ErrorCode,
  ScraperError,
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
} from './types.js';

export { ScraperException } from './types.js';

// Constants
export {
  TIMEOUT_MS,
  MEDIUM_DOMAINS,
  CSS_SELECTORS,
  ERROR_MESSAGES,
  ELEMENTS_TO_REMOVE,
  ELEMENTS_TO_PRESERVE,
} from './constants.js';

// Main scraper function
export { scrapeArticle } from './medium-scraper.js';

// Utilities (for advanced usage)
export { cleanHtml, extractImages } from './html-cleaner.js';
export { downloadImage, downloadAllImages } from './image-downloader.js';
