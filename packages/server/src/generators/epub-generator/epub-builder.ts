/**
 * ePub Content Builder
 *
 * Builds chapter content for ePub generation.
 */

import type { Article } from './types.js';
import { escapeHtml } from '../pdf-generator/html-template.js';

/**
 * Build XHTML content for a single chapter/article
 */
export function buildChapterContent(article: Article, includeImages: boolean): string {
  let content = article.content;

  // Handle images
  if (!includeImages) {
    // Remove all image tags
    content = content.replace(/<img[^>]*>/gi, '');
  } else {
    // Replace image URLs with base64 if available
    for (const img of article.images) {
      if (img.base64) {
        const escapedUrl = img.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        content = content.replace(
          new RegExp(`src=["']${escapedUrl}["']`, 'g'),
          `src="${img.base64}"`
        );
      }
    }
  }

  // Build chapter with article metadata
  const subtitle = article.subtitle ? `<h2>${escapeHtml(article.subtitle)}</h2>` : '';

  return `<h1>${escapeHtml(article.title)}</h1>
${subtitle}
<p class="author">By ${escapeHtml(article.author)} | ${escapeHtml(article.publishedDate)}</p>
<div class="content">${content}</div>`;
}

/**
 * Build chapters array for epub-gen-memory
 */
export function buildChapters(
  articles: Article[],
  includeImages: boolean
): Array<{ title: string; content: string }> {
  return articles.map((article) => ({
    title: article.title,
    content: buildChapterContent(article, includeImages),
  }));
}
