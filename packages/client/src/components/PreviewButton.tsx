import { LoadingSpinner } from './LoadingSpinner';

interface PreviewButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function PreviewButton({ onClick, loading, disabled = false }: PreviewButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading ? 'Previewing...' : 'Preview Articles'}</span>
    </button>
  );
}
