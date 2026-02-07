import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as api from './api/client';

// Mock the API client
vi.mock('./api/client', () => ({
  previewUrls: vi.fn(),
  convertToEbook: vi.fn(),
  downloadFile: vi.fn(),
  ApiException: class ApiException extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const mockPreviewUrls = vi.mocked(api.previewUrls);
const mockConvertToEbook = vi.mocked(api.convertToEbook);
const mockDownloadFile = vi.mocked(api.downloadFile);

describe('App Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error for empty URL validation', async () => {
    render(<App />);

    // Click preview without entering URLs
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter at least one URL')).toBeInTheDocument();
    });

    expect(mockPreviewUrls).not.toHaveBeenCalled();
  });

  it('shows error for max 10 URLs validation', async () => {
    render(<App />);

    // Enter 11 URLs
    const urls = Array(11)
      .fill(null)
      .map((_, i) => `https://medium.com/article${i + 1}`)
      .join('\n');

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: urls },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Maximum 10 URLs allowed')).toBeInTheDocument();
    });

    expect(mockPreviewUrls).not.toHaveBeenCalled();
  });

  it('shows rate limit error with retry message', async () => {
    const apiException = new api.ApiException(
      'RATE_LIMIT',
      'Too many requests. Please wait a moment.'
    );
    mockPreviewUrls.mockRejectedValueOnce(apiException);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/article1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  it('triggers download with correct filename', async () => {
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    mockConvertToEbook.mockResolvedValueOnce(mockBlob);

    render(<App />);

    // Load articles
    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    // Fill title and generate
    fireEvent.change(screen.getByLabelText(/ebook title/i), {
      target: { value: 'My Custom eBook!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(mockDownloadFile).toHaveBeenCalledWith(mockBlob, 'My Custom eBook.pdf');
    });
  });

  it('disables inputs during loading state', async () => {
    // Make the preview take some time
    mockPreviewUrls.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    // During loading, inputs should be disabled
    expect(screen.getByLabelText(/medium article urls/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /previewing/i })).toBeDisabled();
  });

  it('clears errors on new preview', async () => {
    const apiException = new api.ApiException('NETWORK_ERROR', 'Network error');
    mockPreviewUrls.mockRejectedValueOnce(apiException);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Setup success for next call
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    // Try again - error should be cleared
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  it('handles ePub format selection', async () => {
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    const mockBlob = new Blob(['EPUB content'], { type: 'application/epub+zip' });
    mockConvertToEbook.mockResolvedValueOnce(mockBlob);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    // Select ePub format
    fireEvent.click(screen.getByLabelText(/epub/i));

    // Fill title and generate
    fireEvent.change(screen.getByLabelText(/ebook title/i), {
      target: { value: 'My eBook' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(mockConvertToEbook).toHaveBeenCalledWith({
        urls: ['https://medium.com/1'],
        format: 'epub',
        options: { title: 'My eBook' },
      });
      expect(mockDownloadFile).toHaveBeenCalledWith(mockBlob, 'My eBook.epub');
    });
  });

  it('handles generation error gracefully', async () => {
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    const apiException = new api.ApiException('TIMEOUT', 'Request timed out');
    mockConvertToEbook.mockRejectedValueOnce(apiException);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/ebook title/i), {
      target: { value: 'My eBook' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Request timed out')).toBeInTheDocument();
    });

    expect(mockDownloadFile).not.toHaveBeenCalled();
  });
});
