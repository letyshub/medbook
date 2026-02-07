/**
 * ePub Generator Module
 *
 * Generates ePub documents from article collections.
 */

// Main function
export { generateEpub } from './epub-renderer.js';

// Builder functions (for testing)
export { buildChapterContent, buildChapters } from './epub-builder.js';

// Types
export {
  GeneratorException,
  type GeneratorError,
  type GeneratorErrorCode,
  type EpubOptions,
  type ResolvedEpubOptions,
  type Article,
  type ArticleImage,
  type GeneratorApiResponse,
} from './types.js';

// Constants
export {
  MAX_ARTICLES,
  MAX_CONTENT_SIZE_MB,
  RENDER_TIMEOUT_MS,
  EPUB_MIME_TYPE,
  DEFAULT_OPTIONS,
  ERROR_MESSAGES,
} from './constants.js';
