import { LoadingSpinner } from './LoadingSpinner';

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export function GenerateButton({ onClick, loading, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading ? 'Generating...' : 'Generate & Download'}</span>
    </button>
  );
}
