import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadImage, downloadAllImages } from './image-downloader.js';

describe('image-downloader', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('downloadImage', () => {
    it('downloads image and converts to base64', async () => {
      const mockImageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(mockImageData.buffer),
      } as Response);

      const result = await downloadImage('https://example.com/image.png');

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(fetch).toHaveBeenCalledWith('https://example.com/image.png', expect.any(Object));
    });

    it('returns undefined on fetch error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await downloadImage('https://example.com/fail.jpg');

      expect(result).toBeUndefined();
    });

    it('returns undefined on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await downloadImage('https://example.com/notfound.jpg');

      expect(result).toBeUndefined();
    });

    it('returns undefined for non-image content-type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as Response);

      const result = await downloadImage('https://example.com/notimage');

      expect(result).toBeUndefined();
    });

    it('returns undefined for images exceeding size limit', async () => {
      const largeData = new Uint8Array(6 * 1024 * 1024); // 6MB

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg',
          'content-length': String(largeData.length),
        }),
        arrayBuffer: () => Promise.resolve(largeData.buffer),
      } as Response);

      const result = await downloadImage('https://example.com/large.jpg');

      expect(result).toBeUndefined();
    });

    it('uses default content-type when header missing', async () => {
      const mockImageData = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG header

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({}),
        arrayBuffer: () => Promise.resolve(mockImageData.buffer),
      } as Response);

      const result = await downloadImage('https://example.com/image');

      // Default content-type is image/jpeg, which passes validation
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('includes correct User-Agent header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      await downloadImage('https://example.com/test.jpg');

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/test.jpg',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('MedBook'),
          }),
        })
      );
    });
  });

  describe('downloadAllImages', () => {
    it('downloads multiple images in parallel', async () => {
      const mockData = new Uint8Array([1, 2, 3]);

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: () => Promise.resolve(mockData.buffer),
      } as Response);

      const images = await downloadAllImages([
        { url: 'https://example.com/1.jpg', alt: 'Image 1' },
        { url: 'https://example.com/2.jpg', alt: 'Image 2' },
      ]);

      expect(images).toHaveLength(2);
      expect(images[0].originalUrl).toBe('https://example.com/1.jpg');
      expect(images[0].alt).toBe('Image 1');
      expect(images[0].base64).toBeDefined();
    });

    it('limits images to MAX_IMAGES_PER_ARTICLE', async () => {
      // Create 60 image requests (limit is 50)
      const imageData = Array.from({ length: 60 }, (_, i) => ({
        url: `https://example.com/${i}.jpg`,
        alt: `Image ${i}`,
      }));

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      } as Response);

      const images = await downloadAllImages(imageData);

      expect(images).toHaveLength(50); // Should be limited to 50
    });

    it('preserves alt text and original URL even on failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const images = await downloadAllImages([
        { url: 'https://example.com/fail.jpg', alt: 'Failed image' },
      ]);

      expect(images).toHaveLength(1);
      expect(images[0].originalUrl).toBe('https://example.com/fail.jpg');
      expect(images[0].alt).toBe('Failed image');
      expect(images[0].base64).toBeUndefined();
    });

    it('returns empty array for empty input', async () => {
      const images = await downloadAllImages([]);

      expect(images).toEqual([]);
    });
  });
});
