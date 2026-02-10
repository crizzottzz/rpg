import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { listRulesets } from '../api/rulesets';
import { useApiCache } from '../hooks/use-api-cache';

export default function RulesetsPage() {
  const { data: rulesets, loading } = useApiCache(listRulesets);

  if (loading) return <div className="p-8 text-label">Loading...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-heading mb-6">Rulesets</h1>
      <div className="space-y-3">
        {(rulesets ?? []).map((r) => (
          <Link
            key={r.id}
            to={`/rulesets/${r.id}`}
            className="flex items-center gap-4 p-4 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
          >
            <BookOpen className="text-accent" size={24} />
            <div className="flex-1">
              <div className="font-medium text-heading">{r.name}</div>
              <div className="text-sm text-label">
                {r.entity_count.toLocaleString()} entities &middot;{' '}
                {r.entity_types.length} types
              </div>
            </div>
            <span className="text-xs text-muted bg-subtle px-2 py-1 rounded">
              {r.source_type}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
