import { Link } from 'react-router-dom';
import { Plus, Swords } from 'lucide-react';
import { listCampaigns } from '../api/campaigns';
import { useApiCache } from '../hooks/use-api-cache';

export default function CampaignsPage() {
  const { data: campaigns, loading } = useApiCache(listCampaigns);

  if (loading) return <div className="p-8 text-label">Loading...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-heading">Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Campaign
        </Link>
      </div>

      {(campaigns ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Swords className="mx-auto mb-3 opacity-50" size={40} />
          <p>No campaigns yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(campaigns ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="block p-4 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-heading">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {c.character_count} character{c.character_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs capitalize text-muted bg-subtle px-2 py-0.5 rounded">
                    {c.status}
                  </span>
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-label mt-1">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
