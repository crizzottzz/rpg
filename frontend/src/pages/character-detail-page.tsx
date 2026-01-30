import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Trash2, Save } from 'lucide-react';
import { getCharacter, updateCharacter, deleteCharacter } from '../api/characters';
import type { Character, AbilityScores } from '../types';

const ABILITY_KEYS: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

export default function CharacterDetailPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) return;
    getCharacter(characterId)
      .then((c) => {
        setCharacter(c);
        setEditData(c);
      })
      .finally(() => setLoading(false));
  }, [characterId]);

  const handleSave = async () => {
    if (!characterId) return;
    const updated = await updateCharacter(characterId, editData);
    setCharacter(updated);
    setEditData(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!characterId || !confirm('Delete this character?')) return;
    await deleteCharacter(characterId);
    navigate(`/campaigns/${character?.campaign_id}`);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!character) return <div className="p-8 text-red-400">Character not found</div>;

  const core = character.core_data;
  const scores = core.ability_scores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const classData = character.class_data as Record<string, unknown>;

  return (
    <div className="p-8 max-w-4xl">
      <Link
        to={`/campaigns/${character.campaign_id}`}
        className="text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; Campaign
      </Link>
      <div className="flex items-start justify-between mt-1 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{character.name}</h1>
          <p className="text-gray-400">
            Level {character.level} {core.species || ''} {classData?.name ? String(classData.name) : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg text-sm transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg text-sm transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-400 transition-colors p-2"
            title="Delete character"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {ABILITY_KEYS.map((key) => (
          <div
            key={key}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center"
          >
            <div className="text-xs text-gray-500 uppercase">{key}</div>
            <div className="text-2xl font-bold text-gray-100">{scores[key]}</div>
            <div className="text-sm text-amber-400">{modifier(scores[key])}</div>
          </div>
        ))}
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="HP" value={`${core.hp_current ?? '—'} / ${core.hp_max ?? '—'}`} />
        <StatBox label="AC" value={String(core.ac ?? '—')} />
        <StatBox label="Speed" value={`${core.speed ?? 30} ft`} />
        <StatBox
          label="Prof. Bonus"
          value={`+${core.proficiency_bonus ?? Math.ceil(character.level / 4) + 1}`}
        />
      </div>

      {/* Equipment */}
      {character.equipment.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Equipment</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <ul className="space-y-1 text-gray-300">
              {character.equipment.map((item, i) => (
                <li key={i}>
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Spells */}
      {character.spells.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Spells</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <ul className="space-y-1 text-gray-300">
              {character.spells.map((spell, i) => (
                <li key={i}>
                  {typeof spell === 'string' ? spell : JSON.stringify(spell)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-100">{value}</div>
    </div>
  );
}
