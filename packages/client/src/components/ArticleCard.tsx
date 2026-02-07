import type { ArticlePreview } from '../api/types';

interface ArticleCardProps {
  article: ArticlePreview;
  selected: boolean;
  onToggle: (url: string) => void;
}

export function ArticleCard({ article, selected, onToggle }: ArticleCardProps) {
  return (
    <div
      className={`bg-gray-700 border rounded-lg p-4 transition-colors ${
        selected ? 'border-blue-500' : 'border-gray-600'
      }`}
    >
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(article.url)}
          className="mt-1 w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-100 font-medium truncate">{article.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-400">
            <span>{article.author}</span>
            <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
            {article.readingTime && <span>{article.readingTime}</span>}
          </div>
        </div>
      </label>
    </div>
  );
}
