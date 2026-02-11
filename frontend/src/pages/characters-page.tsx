import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import Spinner from '../components/spinner';
import { listAllCharacters } from '../api/characters';
import { useApiCache } from '../hooks/use-api-cache';

export default function CharactersPage() {
  const { data: characters, loading } = useApiCache(listAllCharacters);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-heading mb-6">All Characters</h1>

      {(characters ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users className="mx-auto mb-3 opacity-50" size={40} />
          <p>No characters yet. Create a campaign first, then add characters.</p>
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
                <span className="ml-3 text-sm text-muted">Level {c.level}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted">{c.campaign_name}</span>
                <span className="ml-2 text-xs text-muted uppercase">{c.character_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
