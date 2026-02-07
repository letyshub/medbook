/**
 * Image Downloader - Fetches images and converts to base64
 */

import { TIMEOUT_MS } from './constants.js';
import type { ArticleImage } from './types.js';

// Image limits to prevent memory exhaustion
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_IMAGES_PER_ARTICLE = 50;

/**
 * Downloads an image and converts it to base64 data URI
 * Returns undefined if the download fails (doesn't throw)
 */
export async function downloadImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MedBook/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return undefined;
    }

    // Check content-type is an image
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return undefined;
    }

    // Check content-length before downloading full body
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Double-check size after download (in case content-length was missing/wrong)
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return undefined;
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return `data:${contentType};base64,${base64}`;
  } catch {
    // Silently fail - return undefined for failed images
    return undefined;
  }
}

/**
 * Downloads all images in parallel and returns ArticleImage array
 * Limited to MAX_IMAGES_PER_ARTICLE to prevent memory exhaustion
 */
export async function downloadAllImages(
  imageData: Array<{ url: string; alt?: string }>
): Promise<ArticleImage[]> {
  // Limit number of images to prevent memory exhaustion
  const limitedImageData = imageData.slice(0, MAX_IMAGES_PER_ARTICLE);

  const results = await Promise.all(
    limitedImageData.map(async ({ url, alt }) => {
      const base64 = await downloadImage(url);
      return {
        originalUrl: url,
        base64,
        alt,
      };
    })
  );

  return results;
}
