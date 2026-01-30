import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Swords } from 'lucide-react';
import { listCampaigns } from '../api/campaigns';
import type { Campaign } from '../types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Swords className="mx-auto mb-3 opacity-50" size={40} />
          <p>No campaigns yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-100">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {c.character_count} character{c.character_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs capitalize text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {c.status}
                  </span>
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-gray-400 mt-1">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
