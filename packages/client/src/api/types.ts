/**
 * Frontend API Types
 * Mirrors backend response structures for type safety
 */

// Error codes from backend
export type ErrorCode =
  | 'INVALID_URL'
  | 'INVALID_INPUT'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'PAYWALL'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'RATE_LIMIT';

// API error structure
export interface ApiError {
  code: ErrorCode;
  message: string;
}

// Article preview metadata (from /api/preview)
export interface ArticlePreview {
  url: string;
  title: string;
  author: string;
  publishedDate: string;
  readingTime?: string;
}

// Preview API response
export interface PreviewResponse {
  success: boolean;
  data?: {
    articles: ArticlePreview[];
  };
  error?: ApiError;
}

// Convert request body
export interface ConvertRequest {
  urls: string[];
  format: 'pdf' | 'epub';
  options: {
    title: string;
    includeImages?: boolean;
  };
}

// Convert API error response (success returns binary blob)
export interface ConvertErrorResponse {
  success: false;
  error: ApiError;
}
