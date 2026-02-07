import type { ApiError } from '../api/types';

interface ErrorAlertProps {
  errors: ApiError[];
  onDismiss: () => void;
}

export function ErrorAlert({ errors, onDismiss }: ErrorAlertProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {errors.length === 1 ? (
            <p>{errors[0].message}</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 text-red-400 hover:text-red-200 p-1"
          aria-label="Dismiss errors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
