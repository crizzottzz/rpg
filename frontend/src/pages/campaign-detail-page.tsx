import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users } from 'lucide-react';
import ConfirmDialog from '../components/confirm-dialog';
import Spinner from '../components/spinner';
import { getCampaign, deleteCampaign } from '../api/campaigns';
import { listCharacters } from '../api/characters';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';
import type { Character } from '../types';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, loading: loadingCampaign } = useApiCache(
    getCampaign,
    [id!],
    { enabled: !!id },
  );
  const { data: characters, loading: loadingChars } = useApiCache<Character[]>(
    listCharacters,
    [id!],
    { enabled: !!id },
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteCampaign(id);
    invalidateCache('listCampaigns');
    navigate('/campaigns');
  }, [id, navigate]);

  if (loadingCampaign || loadingChars) return <Spinner />;
  if (!campaign) return <div className="p-8 text-danger">Campaign not found</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <Link to="/campaigns" className="text-sm text-muted hover:text-content">
        &larr; Campaigns
      </Link>
      <div className="flex items-start justify-between mt-1 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-heading">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-label mt-1">{campaign.description}</p>
          )}
          <span className="text-xs text-muted capitalize">{campaign.status}</span>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-muted hover:text-danger transition-colors p-2"
          aria-label="Delete campaign"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Campaign"
        message="Delete this campaign and all its characters? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-content">Characters</h2>
        <Link
          to={`/campaigns/${id}/characters/new`}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          Add Character
        </Link>
      </div>

      {(characters ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users className="mx-auto mb-3 opacity-50" size={40} />
          <p>No characters yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(characters ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/characters/${c.id}`}
              className="flex items-center justify-between p-4 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
            >
              <div>
                <span className="font-medium text-heading">{c.name}</span>
                <span className="ml-3 text-sm text-muted">
                  Level {c.level} {c.core_data?.species || ''}{' '}
                  {c.class_data?.name ? String(c.class_data.name) : ''}
                </span>
              </div>
              <span className="text-xs text-muted uppercase">{c.character_type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
