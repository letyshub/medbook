/**
 * PDF Generator Types
 */

// Re-export Article types from scraper for convenience
export type { Article, ArticleImage } from '../../scraper/types.js';

// Error codes for generator operations
export type GeneratorErrorCode =
  | 'INVALID_INPUT'
  | 'EMPTY_ARTICLES'
  | 'TOO_MANY_ARTICLES'
  | 'CONTENT_TOO_LARGE'
  | 'RENDER_ERROR'
  | 'TIMEOUT';

// Generator error type
export interface GeneratorError {
  code: GeneratorErrorCode;
  message: string;
}

// Custom error class for generator errors
export class GeneratorException extends Error {
  code: GeneratorErrorCode;

  constructor(code: GeneratorErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'GeneratorException';
  }
}

// PDF generation options
export interface PdfOptions {
  title: string;              // Required: collection title
  author?: string;            // Optional: collection author
  pageSize?: 'A4' | 'Letter'; // Default: 'A4'
  fontSize?: number;          // Default: 12
  includeImages?: boolean;    // Default: true
}

// Internal type with all options required (after defaults applied)
export type ResolvedPdfOptions = Required<PdfOptions>;

// API response types
export interface GeneratorSuccessResponse {
  success: true;
  // For PDF, the actual response is binary, not JSON
}

export interface GeneratorErrorResponse {
  success: false;
  error: GeneratorError;
}

export type GeneratorApiResponse = GeneratorSuccessResponse | GeneratorErrorResponse;
