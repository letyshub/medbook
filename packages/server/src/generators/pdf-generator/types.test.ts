import { describe, it, expect } from 'vitest';
import {
  GeneratorException,
  type GeneratorErrorCode,
  type PdfOptions,
} from './types.js';

describe('types', () => {
  describe('GeneratorException', () => {
    it('creates exception with code and message', () => {
      const error = new GeneratorException('INVALID_INPUT', 'Test message');

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('GeneratorException');
    });

    it('is instanceof Error', () => {
      const error = new GeneratorException('RENDER_ERROR', 'Render failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GeneratorException);
    });

    it('supports all error codes', () => {
      const codes: GeneratorErrorCode[] = [
        'INVALID_INPUT',
        'EMPTY_ARTICLES',
        'TOO_MANY_ARTICLES',
        'CONTENT_TOO_LARGE',
        'RENDER_ERROR',
        'TIMEOUT',
      ];

      for (const code of codes) {
        const error = new GeneratorException(code, `Error: ${code}`);
        expect(error.code).toBe(code);
      }
    });
  });

  describe('type exports', () => {
    it('PdfOptions interface accepts valid options', () => {
      const options: PdfOptions = {
        title: 'Test eBook',
        author: 'Test Author',
        pageSize: 'A4',
        fontSize: 14,
        includeImages: true,
      };

      expect(options.title).toBe('Test eBook');
      expect(options.author).toBe('Test Author');
      expect(options.pageSize).toBe('A4');
      expect(options.fontSize).toBe(14);
      expect(options.includeImages).toBe(true);
    });

    it('PdfOptions accepts minimal options', () => {
      const options: PdfOptions = {
        title: 'Minimal eBook',
      };

      expect(options.title).toBe('Minimal eBook');
      expect(options.author).toBeUndefined();
    });
  });
});
