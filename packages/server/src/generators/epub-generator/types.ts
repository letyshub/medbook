/**
 * ePub Generator Types
 */

// Re-export Article types from scraper for convenience
export type { Article, ArticleImage } from '../../scraper/types.js';

// Re-export error types from PDF generator for consistency
export { GeneratorException } from '../pdf-generator/types.js';
export type { GeneratorErrorCode, GeneratorError, GeneratorApiResponse } from '../pdf-generator/types.js';

// ePub generation options
export interface EpubOptions {
  title: string;              // Required: eBook title
  author?: string;            // Optional: author name
  language?: string;          // Optional: language code (default: 'en')
  cover?: string;             // Optional: cover image (base64 or data URI)
  includeImages?: boolean;    // Optional: include article images (default: true)
}

// Internal type with all options required (after defaults applied)
export type ResolvedEpubOptions = Required<EpubOptions>;
