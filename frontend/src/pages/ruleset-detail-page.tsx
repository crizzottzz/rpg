import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '../components/spinner';
import { getRuleset, listEntities, listSources } from '../api/rulesets';
import { useApiCache } from '../hooks/use-api-cache';
import { pluralize } from '../utils/pluralize';

export default function RulesetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeType, setActiveType] = useState('');
  const [activeSource, setActiveSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: ruleset, loading: loadingRuleset } = useApiCache(
    getRuleset,
    [id!],
    { enabled: !!id },
  );

  // Auto-select first type once ruleset loads
  useEffect(() => {
    if (ruleset && ruleset.entity_types.length > 0 && !activeType) {
      setActiveType(ruleset.entity_types[0]);
    }
  }, [ruleset, activeType]);

  // Fetch sources scoped to the active entity type
  const { data: sources } = useApiCache(
    listSources,
    [id!, activeType || undefined],
    { enabled: !!id && !!activeType },
  );

  const { data: entityPage } = useApiCache(
    listEntities,
    [id!, { type: activeType, search: search || undefined, source: activeSource || undefined, page, per_page: 50 }],
    { enabled: !!id && !!activeType },
  );

  const entities = entityPage?.entities ?? [];
  const total = entityPage?.total ?? 0;
  const pages = entityPage?.pages ?? 0;

  const defaultSource = sources?.find((s) => s.is_default);

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setActiveSource('');
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setActiveSource(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (loadingRuleset || !ruleset) return <Spinner />;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <Link to="/rulesets" className="text-sm text-muted hover:text-content">
          &larr; Rulesets
        </Link>
        <h1 className="text-2xl font-bold text-heading mt-1">{ruleset.name}</h1>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {ruleset.entity_types.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              type === activeType
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-label hover:bg-subtle border border-transparent'
            }`}
          >
            {pluralize(type)}
          </button>
        ))}
      </div>

      {/* Source selector + Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {sources && sources.length > 1 && (
          <select
            value={activeSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="px-3 py-2 bg-surface border border-edge rounded-lg text-sm text-heading focus:outline-none focus:border-accent sm:w-64"
          >
            <option value="">
              {defaultSource ? `Default (${defaultSource.display_name})` : 'Default'}
            </option>
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s.key} value={s.key}>
                {s.display_name} ({s.entity_count})
              </option>
            ))}
          </select>
        )}

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder={`Search ${pluralize(activeType)}...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted mb-3">
        {total.toLocaleString()} {pluralize(activeType)} found
      </div>

      {/* Entity list */}
      <div className="space-y-1">
        {entities.map((entity) => (
          <Link
            key={entity.id}
            to={`/rulesets/${ruleset.id}/entities/${entity.id}`}
            className="flex items-center justify-between px-4 py-2.5 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
          >
            <span className="text-heading">{entity.name}</span>
            {activeSource === 'all' && entity.document_key && (
              <span className="text-xs text-muted ml-2 shrink-0">
                {sources?.find((s) => s.key === entity.document_key)?.display_name ?? entity.document_key}
              </span>
            )}
            {activeSource === '' && entity.document_key && entity.document_key !== defaultSource?.key && (
              <span className="text-xs text-muted ml-2 shrink-0">
                {sources?.find((s) => s.key === entity.document_key)?.display_name ?? entity.document_key}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 text-label hover:text-content disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-label">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="p-2 text-label hover:text-content disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
