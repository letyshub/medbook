import type { ArticlePreview } from '../api/types';
import { ArticleCard } from './ArticleCard';

interface ArticleListProps {
  articles: ArticlePreview[];
  selectedUrls: Set<string>;
  onToggle: (url: string) => void;
}

export function ArticleList({ articles, selectedUrls, onToggle }: ArticleListProps) {
  if (articles.length === 0) return null;

  return (
    <div className="grid gap-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.url}
          article={article}
          selected={selectedUrls.has(article.url)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
