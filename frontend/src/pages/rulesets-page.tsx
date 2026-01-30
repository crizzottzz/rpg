import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { listRulesets } from '../api/rulesets';
import { useApiCache } from '../hooks/use-api-cache';

export default function RulesetsPage() {
  const { data: rulesets, loading } = useApiCache(listRulesets);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Rulesets</h1>
      <div className="space-y-3">
        {(rulesets ?? []).map((r) => (
          <Link
            key={r.id}
            to={`/rulesets/${r.id}`}
            className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
          >
            <BookOpen className="text-amber-400" size={24} />
            <div className="flex-1">
              <div className="font-medium text-gray-100">{r.name}</div>
              <div className="text-sm text-gray-400">
                {r.entity_count.toLocaleString()} entities &middot;{' '}
                {r.entity_types.length} types
              </div>
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {r.source_type}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
