import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRuleset, listEntities } from '../api/rulesets';
import { useApiCache } from '../hooks/use-api-cache';
import { pluralize } from '../utils/pluralize';

export default function RulesetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeType, setActiveType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: ruleset, loading: loadingRuleset } = useApiCache(
    getRuleset,
    [id!],
    { enabled: !!id },
  );

  // Auto-select first type once ruleset loads
  if (ruleset && ruleset.entity_types.length > 0 && !activeType) {
    setActiveType(ruleset.entity_types[0]);
  }

  const { data: entityPage } = useApiCache(
    listEntities,
    [id!, { type: activeType, search: search || undefined, page, per_page: 50 }],
    { enabled: !!id && !!activeType },
  );

  const entities = entityPage?.entities ?? [];
  const total = entityPage?.total ?? 0;
  const pages = entityPage?.pages ?? 0;

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (loadingRuleset || !ruleset) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link to="/rulesets" className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Rulesets
        </Link>
        <h1 className="text-2xl font-bold text-gray-100 mt-1">{ruleset.name}</h1>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {ruleset.entity_types.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              type === activeType
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                : 'text-gray-400 hover:bg-gray-800 border border-transparent'
            }`}
          >
            {pluralize(type)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder={`Search ${pluralize(activeType)}...`}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-3">
        {total.toLocaleString()} {pluralize(activeType)} found
      </div>

      {/* Entity list */}
      <div className="space-y-1">
        {entities.map((entity) => (
          <Link
            key={entity.id}
            to={`/rulesets/${ruleset.id}/entities/${entity.id}`}
            className="block px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
          >
            <span className="text-gray-100">{entity.name}</span>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
