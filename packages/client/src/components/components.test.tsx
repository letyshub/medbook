import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { UrlTextarea } from './UrlTextarea';
import { ArticleCard } from './ArticleCard';
import { FormatPicker } from './FormatPicker';
import { GenerateButton } from './GenerateButton';

describe('UI Components', () => {
  describe('LoadingSpinner', () => {
    it('renders SVG animation', () => {
      render(<LoadingSpinner />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('ErrorAlert', () => {
    it('displays message and dismisses', () => {
      const onDismiss = vi.fn();
      render(
        <ErrorAlert
          errors={[{ code: 'NETWORK_ERROR', message: 'Network error occurred' }]}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('UrlTextarea', () => {
    it('handles controlled input', () => {
      const onChange = vi.fn();
      render(<UrlTextarea value="https://medium.com/test" onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('https://medium.com/test');

      fireEvent.change(textarea, { target: { value: 'https://medium.com/new' } });
      expect(onChange).toHaveBeenCalledWith('https://medium.com/new');
    });
  });

  describe('ArticleCard', () => {
    it('shows metadata and checkbox', () => {
      const onToggle = vi.fn();
      render(
        <ArticleCard
          article={{
            url: 'https://medium.com/test',
            title: 'Test Article',
            author: 'Test Author',
            publishedDate: '2026-01-15',
            readingTime: '5 min read',
          }}
          selected={false}
          onToggle={onToggle}
        />
      );

      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('5 min read')).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(onToggle).toHaveBeenCalledWith('https://medium.com/test');
    });
  });

  describe('FormatPicker', () => {
    it('handles radio button selection', () => {
      const onChange = vi.fn();
      render(<FormatPicker value="pdf" onChange={onChange} />);

      const pdfRadio = screen.getByLabelText(/pdf/i);
      const epubRadio = screen.getByLabelText(/epub/i);

      expect(pdfRadio).toBeChecked();
      expect(epubRadio).not.toBeChecked();

      fireEvent.click(epubRadio);
      expect(onChange).toHaveBeenCalledWith('epub');
    });
  });

  describe('GenerateButton', () => {
    it('handles disabled state logic', () => {
      const onClick = vi.fn();

      // Should be disabled when no selection or no title
      const { rerender } = render(
        <GenerateButton
          disabled={true}
          loading={false}
          onClick={onClick}
        />
      );

      const button = screen.getByRole('button', { name: /generate/i });
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();

      // Should be enabled when valid
      rerender(
        <GenerateButton
          disabled={false}
          loading={false}
          onClick={onClick}
        />
      );

      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });
  });
});
