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

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows URL input section on initial render', () => {
    render(<App />);

    expect(screen.getByText('Medium to eBook Converter')).toBeInTheDocument();
    expect(screen.getByLabelText(/medium article urls/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();

    // Articles section should not be visible initially
    expect(screen.queryByText(/select all/i)).not.toBeInTheDocument();
  });

  it('handles preview flow: paste URLs → click Preview → show cards', async () => {
    const mockArticles = [
      {
        url: 'https://medium.com/article1',
        title: 'Test Article',
        author: 'Test Author',
        publishedDate: '2026-01-15',
        readingTime: '5 min read',
      },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    render(<App />);

    // Enter URLs
    const textarea = screen.getByLabelText(/medium article urls/i);
    fireEvent.change(textarea, { target: { value: 'https://medium.com/article1' } });

    // Click preview
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);

    // Wait for articles to appear
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(mockPreviewUrls).toHaveBeenCalledWith(['https://medium.com/article1']);
  });

  it('handles article selection: check/uncheck updates state', async () => {
    const mockArticles = [
      {
        url: 'https://medium.com/article1',
        title: 'Article 1',
        author: 'Author 1',
        publishedDate: '2026-01-15',
      },
      {
        url: 'https://medium.com/article2',
        title: 'Article 2',
        author: 'Author 2',
        publishedDate: '2026-01-16',
      },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    render(<App />);

    // Load articles
    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/article1\nhttps://medium.com/article2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    // All should be selected by default
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    // Uncheck first article
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('handles bulk selection: Select All / Deselect All', async () => {
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
      { url: 'https://medium.com/2', title: 'Article 2', author: 'B', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1\nhttps://medium.com/2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    // Deselect all
    fireEvent.click(screen.getByText('Deselect All'));
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    // Select all
    fireEvent.click(screen.getByText('Select All'));
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('disables generate until title + selection', async () => {
    const mockArticles = [
      { url: 'https://medium.com/1', title: 'Article 1', author: 'A', publishedDate: '2026-01-15' },
    ];
    mockPreviewUrls.mockResolvedValueOnce(mockArticles);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument();
    });

    const generateButton = screen.getByRole('button', { name: /generate/i });

    // Should be disabled without title
    expect(generateButton).toBeDisabled();

    // Add title - should be enabled
    fireEvent.change(screen.getByLabelText(/ebook title/i), {
      target: { value: 'My eBook' },
    });
    expect(generateButton).not.toBeDisabled();

    // Deselect all - should be disabled again
    fireEvent.click(screen.getByText('Deselect All'));
    expect(generateButton).toBeDisabled();
  });

  it('displays and dismisses errors', async () => {
    const apiException = new api.ApiException('RATE_LIMIT', 'Rate limit exceeded');
    mockPreviewUrls.mockRejectedValueOnce(apiException);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/medium article urls/i), {
      target: { value: 'https://medium.com/1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });

    // Dismiss error
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Rate limit exceeded')).not.toBeInTheDocument();
  });
});
