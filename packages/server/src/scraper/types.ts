/**
 * Medium Article Scraper Types
 */

// Error codes for scraper operations
export type ErrorCode =
  | 'INVALID_URL'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'PAYWALL'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR';

// Scraper error type
export interface ScraperError {
  code: ErrorCode;
  message: string;
}

// Custom error class for scraper errors
export class ScraperException extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ScraperException';
  }
}

// Article image type
export interface ArticleImage {
  originalUrl: string;
  base64?: string;
  alt?: string;
}

// Main article type
export interface Article {
  url: string;
  title: string;
  subtitle?: string;
  author: string;
  publishedDate: string;
  readingTime?: string;
  content: string;
  images: ArticleImage[];
  tags?: string[];
}

// API response types
export interface SuccessResponse {
  success: true;
  data: Article;
}

export interface ErrorResponse {
  success: false;
  error: ScraperError;
}

export type ApiResponse = SuccessResponse | ErrorResponse;
