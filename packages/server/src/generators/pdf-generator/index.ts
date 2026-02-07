/**
 * PDF Generator Module
 *
 * Generates PDF documents from article collections.
 */

// Main function
export { generatePdf } from './pdf-renderer.js';

// Template building (for testing)
export { buildHtmlTemplate } from './html-template.js';

// Types
export {
  GeneratorException,
  type GeneratorError,
  type GeneratorErrorCode,
  type PdfOptions,
  type ResolvedPdfOptions,
  type Article,
  type ArticleImage,
  type GeneratorApiResponse,
} from './types.js';

// Constants
export {
  MAX_ARTICLES,
  MAX_CONTENT_SIZE_MB,
  RENDER_TIMEOUT_MS,
  PAGE_SIZES,
  FONTS,
  DEFAULT_OPTIONS,
  ERROR_MESSAGES,
  PDF_MARGINS,
} from './constants.js';
