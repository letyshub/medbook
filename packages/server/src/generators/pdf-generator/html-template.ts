/**
 * HTML Template Builder for PDF Generation
 */

import type { Article, ResolvedPdfOptions } from './types.js';
import { FONTS } from './constants.js';

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape special regex characters
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the title page HTML
 */
export function buildTitlePage(options: { title: string; author: string }): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div class="title-page">
      <h1 class="book-title">${escapeHtml(options.title)}</h1>
      ${options.author ? `<p class="book-author">by ${escapeHtml(options.author)}</p>` : ''}
      <p class="generation-date">Generated on ${date}</p>
    </div>
  `;
}

/**
 * Build the table of contents HTML
 */
export function buildTableOfContents(articles: Article[]): string {
  const items = articles
    .map(
      (article, index) => `
    <li>
      <a href="#article-${index}">${escapeHtml(article.title)}</a>
      <span class="toc-author">${escapeHtml(article.author)}</span>
    </li>
  `
    )
    .join('');

  return `
    <div class="toc-page">
      <h2>Table of Contents</h2>
      <ol class="toc-list">${items}</ol>
    </div>
  `;
}

/**
 * Build a single article page HTML
 */
export function buildArticlePage(
  article: Article,
  index: number,
  options: { includeImages: boolean }
): string {
  let content = article.content;

  // Handle images
  if (!options.includeImages) {
    // Remove all image tags
    content = content.replace(/<img[^>]*>/gi, '');
  } else {
    // Replace image URLs with base64 if available
    for (const img of article.images) {
      if (img.base64) {
        content = content.replace(
          new RegExp(`src=["']${escapeRegExp(img.originalUrl)}["']`, 'g'),
          `src="${img.base64}"`
        );
      }
    }
  }

  return `
    <div class="article-page" id="article-${index}">
      <h2 class="article-title">${escapeHtml(article.title)}</h2>
      <div class="article-meta">
        <span class="article-author">${escapeHtml(article.author)}</span>
        <span class="article-date">${escapeHtml(article.publishedDate)}</span>
      </div>
      <div class="article-content">${content}</div>
    </div>
  `;
}

/**
 * Generate CSS styles for the PDF
 */
export function getStyles(options: { fontSize: number }): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${FONTS.body};
      font-size: ${options.fontSize}pt;
      line-height: 1.6;
      color: #333;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: ${FONTS.heading};
      margin: 1em 0 0.5em;
    }

    pre, code {
      font-family: ${FONTS.mono};
      font-size: 0.9em;
    }

    pre {
      background: #f5f5f5;
      padding: 1em;
      overflow-x: auto;
      border-radius: 4px;
    }

    /* Title Page */
    .title-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }

    .book-title {
      font-size: 3em;
      margin-bottom: 0.5em;
    }

    .book-author {
      font-size: 1.5em;
      font-style: italic;
      margin-bottom: 2em;
    }

    .generation-date {
      color: #666;
    }

    /* Table of Contents */
    .toc-page {
      page-break-after: always;
      padding-top: 2em;
    }

    .toc-list {
      list-style-position: inside;
      padding-left: 0;
    }

    .toc-list li {
      margin: 0.5em 0;
      padding: 0.25em 0;
      border-bottom: 1px dotted #ccc;
    }

    .toc-list a {
      color: #333;
      text-decoration: none;
    }

    .toc-author {
      float: right;
      color: #666;
      font-style: italic;
    }

    /* Article Pages */
    .article-page {
      page-break-before: always;
      padding-top: 2em;
    }

    .article-title {
      font-size: 2em;
      border-bottom: 2px solid #333;
      padding-bottom: 0.25em;
      margin-bottom: 0.5em;
    }

    .article-meta {
      color: #666;
      margin-bottom: 2em;
      font-style: italic;
    }

    .article-meta span {
      margin-right: 2em;
    }

    .article-content {
      text-align: justify;
    }

    .article-content p {
      margin: 1em 0;
    }

    .article-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }

    blockquote {
      border-left: 4px solid #666;
      padding-left: 1em;
      margin: 1em 0;
      font-style: italic;
      color: #555;
    }

    /* Lists */
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.25em 0;
    }

    /* Links */
    a {
      color: #0066cc;
    }
  `;
}

/**
 * Build the complete HTML template for PDF generation
 */
export function buildHtmlTemplate(
  articles: Article[],
  options: ResolvedPdfOptions
): string {
  const titlePage = buildTitlePage({
    title: options.title,
    author: options.author,
  });

  const toc = buildTableOfContents(articles);

  const articlePages = articles
    .map((article, index) =>
      buildArticlePage(article, index, { includeImages: options.includeImages })
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>${getStyles({ fontSize: options.fontSize })}</style>
</head>
<body>
  ${titlePage}
  ${toc}
  ${articlePages}
</body>
</html>`;
}
