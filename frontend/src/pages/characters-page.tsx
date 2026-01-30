import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { listCampaigns } from '../api/campaigns';
import { listCharacters } from '../api/characters';
import { useApiCache } from '../hooks/use-api-cache';
import type { Character } from '../types';

interface CharacterWithCampaign extends Character {
  campaignName: string;
}

export default function CharactersPage() {
  const { data: campaigns } = useApiCache(listCampaigns);
  const [characters, setCharacters] = useState<CharacterWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaigns) return;
    let cancelled = false;
    (async () => {
      const all: CharacterWithCampaign[] = [];
      for (const campaign of campaigns) {
        const chars = await listCharacters(campaign.id);
        for (const c of chars) {
          all.push({ ...c, campaignName: campaign.name });
        }
      }
      if (!cancelled) {
        setCharacters(all);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [campaigns]);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">All Characters</h1>

      {characters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto mb-3 opacity-50" size={40} />
          <p>No characters yet. Create a campaign first, then add characters.</p>
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
                <span className="ml-3 text-sm text-gray-500">Level {c.level}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">{c.campaignName}</span>
                <span className="ml-2 text-xs text-gray-500 uppercase">{c.character_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
