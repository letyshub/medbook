import { useState } from 'react';
import type { ArticlePreview, ApiError } from './api/types';
import {
  previewUrls,
  convertToEbook,
  downloadFile,
  ApiException,
} from './api/client';
import {
  UrlTextarea,
  PreviewButton,
  ArticleList,
  BulkSelectionControls,
  TitleInput,
  FormatPicker,
  GenerateButton,
  ErrorAlert,
} from './components';

type LoadingState = 'idle' | 'preview' | 'generate';

function App() {
  // State management
  const [urls, setUrls] = useState('');
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'pdf' | 'epub'>('pdf');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [errors, setErrors] = useState<ApiError[]>([]);

  // Parse URLs from textarea
  const parseUrls = (text: string): string[] => {
    return text
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  };

  // Validate URLs
  const validateUrls = (urlList: string[]): ApiError | null => {
    if (urlList.length === 0) {
      return { code: 'INVALID_INPUT', message: 'Please enter at least one URL' };
    }
    if (urlList.length > 10) {
      return { code: 'INVALID_INPUT', message: 'Maximum 10 URLs allowed' };
    }
    return null;
  };

  // Preview flow
  const handlePreview = async () => {
    setErrors([]);
    const urlList = parseUrls(urls);
    const validationError = validateUrls(urlList);

    if (validationError) {
      setErrors([validationError]);
      return;
    }

    setLoading('preview');
    try {
      const result = await previewUrls(urlList);
      setArticles(result);
      // Select all by default
      setSelectedUrls(new Set(result.map((a) => a.url)));
    } catch (error) {
      if (error instanceof ApiException) {
        setErrors([{ code: error.code, message: error.message }]);
      } else {
        setErrors([{ code: 'NETWORK_ERROR', message: 'An unexpected error occurred' }]);
      }
    } finally {
      setLoading('idle');
    }
  };

  // Generate flow
  const handleGenerate = async () => {
    setErrors([]);
    setLoading('generate');

    try {
      const blob = await convertToEbook({
        urls: Array.from(selectedUrls),
        format,
        options: { title },
      });

      const extension = format === 'pdf' ? 'pdf' : 'epub';
      const filename = `${title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'ebook'}.${extension}`;
      downloadFile(blob, filename);
    } catch (error) {
      if (error instanceof ApiException) {
        setErrors([{ code: error.code, message: error.message }]);
      } else {
        setErrors([{ code: 'NETWORK_ERROR', message: 'An unexpected error occurred' }]);
      }
    } finally {
      setLoading('idle');
    }
  };

  // Selection handlers
  const handleToggleArticle = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedUrls(new Set(articles.map((a) => a.url)));
  };

  const handleDeselectAll = () => {
    setSelectedUrls(new Set());
  };

  // Dismiss errors
  const handleDismissErrors = () => {
    setErrors([]);
  };

  // Computed state
  const isLoading = loading !== 'idle';
  const hasArticles = articles.length > 0;
  const canGenerate = selectedUrls.size > 0 && title.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">
            Medium to eBook Converter
          </h1>
          <p className="text-gray-400">
            Convert your favorite Medium articles to PDF and ePub
          </p>
        </header>

        {/* Error Alert */}
        {errors.length > 0 && (
          <ErrorAlert errors={errors} onDismiss={handleDismissErrors} />
        )}

        {/* URL Input Section */}
        <section className="bg-gray-800 rounded-lg p-6 space-y-4">
          <UrlTextarea
            value={urls}
            onChange={setUrls}
            disabled={isLoading}
          />
          <PreviewButton
            onClick={handlePreview}
            loading={loading === 'preview'}
            disabled={isLoading}
          />
        </section>

        {/* Articles Section - only shown after preview */}
        {hasArticles && (
          <section className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-100">
                Articles Found
              </h2>
              <BulkSelectionControls
                totalCount={articles.length}
                selectedCount={selectedUrls.size}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            </div>
            <ArticleList
              articles={articles}
              selectedUrls={selectedUrls}
              onToggle={handleToggleArticle}
            />
          </section>
        )}

        {/* Options Section - only shown after preview */}
        {hasArticles && (
          <section className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100">
              eBook Options
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TitleInput
                value={title}
                onChange={setTitle}
                disabled={isLoading}
              />
              <FormatPicker
                value={format}
                onChange={setFormat}
                disabled={isLoading}
              />
            </div>
          </section>
        )}

        {/* Generate Section - only shown after preview */}
        {hasArticles && (
          <section className="flex justify-center">
            <GenerateButton
              onClick={handleGenerate}
              loading={loading === 'generate'}
              disabled={!canGenerate}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
