import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users } from 'lucide-react';
import { getCampaign, deleteCampaign } from '../api/campaigns';
import { listCharacters } from '../api/characters';
import type { Campaign, Character } from '../types';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCampaign(id), listCharacters(id)])
      .then(([c, chars]) => {
        setCampaign(c);
        setCharacters(chars);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this campaign and all its characters?')) return;
    await deleteCampaign(id);
    navigate('/campaigns');
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!campaign) return <div className="p-8 text-red-400">Campaign not found</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/campaigns" className="text-sm text-gray-500 hover:text-gray-300">
        &larr; Campaigns
      </Link>
      <div className="flex items-start justify-between mt-1 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-gray-400 mt-1">{campaign.description}</p>
          )}
          <span className="text-xs text-gray-500 capitalize">{campaign.status}</span>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-400 transition-colors p-2"
          title="Delete campaign"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Characters</h2>
        <Link
          to={`/campaigns/${id}/characters/new`}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          Add Character
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto mb-3 opacity-50" size={40} />
          <p>No characters yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {characters.map((c) => (
            <Link
              key={c.id}
              to={`/characters/${c.id}`}
              className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div>
                <span className="font-medium text-gray-100">{c.name}</span>
                <span className="ml-3 text-sm text-gray-500">
                  Level {c.level} {c.core_data?.species || ''}{' '}
                  {typeof c.class_data === 'object' && c.class_data !== null
                    ? String((c.class_data as Record<string, unknown>).name ?? '')
                    : ''}
                </span>
              </div>
              <span className="text-xs text-gray-500 uppercase">{c.character_type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
