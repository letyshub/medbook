/**
 * API Client for Medium to eBook Converter
 */

import type {
  ArticlePreview,
  PreviewResponse,
  ConvertRequest,
  ConvertErrorResponse,
  ErrorCode,
} from './types';

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiException';
  }
}

/**
 * Map error codes to user-friendly messages
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    INVALID_URL: 'Invalid URL format. Please check your URLs.',
    INVALID_INPUT: 'Invalid input. Please check your request.',
    NOT_FOUND: 'Article not found. It may have been deleted.',
    PAYWALL: 'This article is behind a paywall.',
    TIMEOUT: 'Request timed out. Please try again.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PARSE_ERROR: 'Failed to parse article content.',
  };
  return messages[code] || 'An unexpected error occurred.';
}

/**
 * Preview URLs - fetch article metadata
 */
export async function previewUrls(urls: string[]): Promise<ArticlePreview[]> {
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as PreviewResponse;
    if (errorData.error) {
      throw new ApiException(errorData.error.code, errorData.error.message);
    }
    throw new ApiException('NETWORK_ERROR', 'Request failed');
  }

  const data = (await response.json()) as PreviewResponse;
  if (!data.success || !data.data) {
    throw new ApiException('NETWORK_ERROR', 'Invalid response format');
  }

  return data.data.articles;
}

/**
 * Convert articles to eBook - returns binary blob
 */
export async function convertToEbook(request: ConvertRequest): Promise<Blob> {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ConvertErrorResponse;
    if (errorData.error) {
      throw new ApiException(errorData.error.code, errorData.error.message);
    }
    throw new ApiException('NETWORK_ERROR', 'Request failed');
  }

  return response.blob();
}

/**
 * Download file - triggers browser download from blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
