/**
 * ePub Renderer
 *
 * Main ePub generation function using epub-gen-memory.
 */

import type { Options as EpubLibOptions, Content as EpubContent } from 'epub-gen-memory';
import { buildChapters } from './epub-builder.js';

// epub-gen-memory exports a function as default, but TypeScript has issues with the module types
// Using dynamic import with type assertion to avoid TypeScript module resolution issues
type EpubGenerator = (options: EpubLibOptions, content: EpubContent) => Promise<Buffer>;

const getEpubGenerator = async (): Promise<EpubGenerator> => {
  const module = await import('epub-gen-memory');
  return module.default as unknown as EpubGenerator;
};
import type { Article, EpubOptions, ResolvedEpubOptions } from './types.js';
import { GeneratorException } from './types.js';
import {
  DEFAULT_OPTIONS,
  MAX_ARTICLES,
  MAX_CONTENT_SIZE_MB,
  RENDER_TIMEOUT_MS,
  ERROR_MESSAGES,
} from './constants.js';

/**
 * Merge user options with defaults
 */
export function resolveOptions(options: EpubOptions): ResolvedEpubOptions {
  return {
    title: options.title,
    author: options.author ?? DEFAULT_OPTIONS.author,
    language: options.language ?? DEFAULT_OPTIONS.language,
    cover: options.cover ?? DEFAULT_OPTIONS.cover,
    includeImages: options.includeImages ?? DEFAULT_OPTIONS.includeImages,
  };
}

/**
 * Validate input articles and options
 */
export function validateInput(articles: unknown, options: EpubOptions): void {
  if (!articles || !Array.isArray(articles)) {
    throw new GeneratorException('INVALID_INPUT', ERROR_MESSAGES.INVALID_INPUT);
  }

  if (articles.length === 0) {
    throw new GeneratorException('EMPTY_ARTICLES', ERROR_MESSAGES.EMPTY_ARTICLES);
  }

  if (articles.length > MAX_ARTICLES) {
    throw new GeneratorException('TOO_MANY_ARTICLES', ERROR_MESSAGES.TOO_MANY_ARTICLES);
  }

  if (!options?.title || typeof options.title !== 'string') {
    throw new GeneratorException('INVALID_INPUT', 'Title is required');
  }
}

/**
 * Check if content size exceeds limit
 */
export function checkContentSize(articles: Article[]): void {
  let totalSize = 0;
  for (const article of articles) {
    totalSize += Buffer.byteLength(article.content, 'utf8');
    for (const img of article.images) {
      if (img.base64) {
        totalSize += Buffer.byteLength(img.base64, 'utf8');
      }
    }
  }

  const sizeMB = totalSize / (1024 * 1024);
  if (sizeMB > MAX_CONTENT_SIZE_MB) {
    throw new GeneratorException('CONTENT_TOO_LARGE', ERROR_MESSAGES.CONTENT_TOO_LARGE);
  }
}

/**
 * Generate an ePub from articles
 *
 * @param articles - Array of articles to include in the ePub
 * @param options - ePub generation options
 * @returns Buffer containing the generated ePub
 */
export async function generateEpub(
  articles: Article[],
  options: EpubOptions
): Promise<Buffer> {
  // Validate input
  validateInput(articles, options);

  // Merge with defaults
  const resolvedOptions = resolveOptions(options);

  // Check content size
  checkContentSize(articles);

  // Build chapters
  const chapters = buildChapters(articles, resolvedOptions.includeImages);

  // Create ePub with timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new GeneratorException('TIMEOUT', ERROR_MESSAGES.TIMEOUT));
    }, RENDER_TIMEOUT_MS);
  });

  try {
    const epubOptions: EpubLibOptions = {
      title: resolvedOptions.title,
      author: resolvedOptions.author || undefined,
      lang: resolvedOptions.language,
      tocTitle: 'Table of Contents',
    };

    // Add cover if provided
    if (resolvedOptions.cover) {
      epubOptions.cover = resolvedOptions.cover;
    }

    const epub = await getEpubGenerator();
    const epubPromise = epub(epubOptions, chapters);
    const epubBuffer = await Promise.race([epubPromise, timeoutPromise]);

    return Buffer.from(epubBuffer);
  } catch (error) {
    // Re-throw GeneratorException as-is
    if (error instanceof GeneratorException) {
      throw error;
    }

    // Wrap other errors
    throw new GeneratorException('RENDER_ERROR', ERROR_MESSAGES.RENDER_ERROR);
  }
}
