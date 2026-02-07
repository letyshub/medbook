interface UrlTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function UrlTextarea({ value, onChange, disabled = false }: UrlTextareaProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="urls" className="block text-gray-100 font-medium">
        Medium Article URLs
      </label>
      <textarea
        id="urls"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Paste Medium article URLs here (one per line)&#10;&#10;Example:&#10;https://medium.com/@author/article-title-abc123&#10;https://medium.com/@author/another-article-def456"
      />
      <p className="text-sm text-gray-400">Maximum 10 URLs per request</p>
    </div>
  );
}
