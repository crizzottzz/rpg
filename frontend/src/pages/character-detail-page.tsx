import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Trash2, Save, X } from 'lucide-react';
import ConfirmDialog from '../components/confirm-dialog';
import Spinner from '../components/spinner';
import { getCharacter, updateCharacter, deleteCharacter } from '../api/characters';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';
import type { AbilityScores } from '../types';

const ABILITY_KEYS: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

/** Number input that lets you clear the field and type freely. */
function NumericInput({
  value,
  onChange,
  min = 1,
  max = 30,
  className = '',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={raw}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        setRaw(v);
        if (v !== '') {
          onChange(Math.min(max, Math.max(min, Number(v))));
        }
      }}
      onBlur={() => {
        if (raw === '' || isNaN(Number(raw))) {
          setRaw(String(min));
          onChange(min);
        } else {
          const clamped = Math.min(max, Math.max(min, Number(raw)));
          setRaw(String(clamped));
          onChange(clamped);
        }
      }}
      className={className}
    />
  );
}

export default function CharacterDetailPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { data: character, loading, refetch } = useApiCache(
    getCharacter,
    [characterId!],
    { enabled: !!characterId },
  );
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState(1);
  const [editScores, setEditScores] = useState<AbilityScores>({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  });

  // Sync edit state when entering edit mode
  useEffect(() => {
    if (editing && character) {
      setEditName(character.name);
      setEditLevel(character.level);
      setEditScores(
        character.core_data.ability_scores ||
        { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      );
    }
  }, [editing, character]);

  const handleSave = async () => {
    if (!characterId || !character) return;
    await updateCharacter(characterId, {
      name: editName,
      level: editLevel,
      core_data: {
        ...character.core_data,
        ability_scores: editScores,
        proficiency_bonus: Math.ceil(editLevel / 4) + 1,
      },
    });
    invalidateCache('getCharacter');
    invalidateCache('listCharacters');
    refetch();
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!characterId) return;
    await deleteCharacter(characterId);
    invalidateCache('listCharacters');
    invalidateCache('listAllCharacters');
    navigate(`/campaigns/${character?.campaign_id}`);
  }, [characterId, character?.campaign_id, navigate]);

  if (loading) return <Spinner />;
  if (!character) return <div className="p-4 sm:p-8 text-danger">Character not found</div>;

  const core = character.core_data;
  const scores = editing
    ? editScores
    : core.ability_scores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const classData = character.class_data as Record<string, unknown>;

  const inputClass =
    'w-full px-2 py-1 bg-subtle border border-edge-hover rounded text-heading text-center focus:outline-none focus:border-accent';

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <Link
        to={`/campaigns/${character.campaign_id}`}
        className="text-sm text-muted hover:text-content"
      >
        &larr; Campaign
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-1 mb-6">
        <div className="min-w-0">
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-2xl font-bold text-heading bg-subtle border border-edge-hover rounded px-2 py-1 focus:outline-none focus:border-accent"
            />
          ) : (
            <h1 className="text-2xl font-bold text-heading">{character.name}</h1>
          )}
          <p className="text-label mt-1">
            {editing ? (
              <span className="inline-flex items-center gap-2">
                Level
                <NumericInput
                  value={editLevel}
                  onChange={setEditLevel}
                  min={1}
                  max={20}
                  className="w-14 px-2 py-0.5 bg-subtle border border-edge-hover rounded text-heading text-center focus:outline-none focus:border-accent"
                />
              </span>
            ) : (
              <>
                Level {character.level} {core.species || ''} {classData?.name ? String(classData.name) : ''}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg text-sm transition-colors"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-label hover:text-content border border-edge-hover rounded-lg text-sm transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-label hover:text-content border border-edge-hover rounded-lg text-sm transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            className="text-muted hover:text-danger transition-colors p-2"
            aria-label="Delete character"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Character"
        message="Delete this character? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Ability Scores */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {ABILITY_KEYS.map((key) => (
          <div
            key={key}
            className="bg-surface border border-edge rounded-lg p-3 text-center"
          >
            <div className="text-xs text-muted uppercase">{key}</div>
            {editing ? (
              <NumericInput
                value={scores[key]}
                onChange={(v) => setEditScores((prev) => ({ ...prev, [key]: v }))}
                min={1}
                max={30}
                className={inputClass}
              />
            ) : (
              <div className="text-2xl font-bold text-heading">{scores[key]}</div>
            )}
            <div className="text-sm text-accent">{modifier(scores[key])}</div>
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
          <h2 className="text-lg font-semibold text-content mb-3">Equipment</h2>
          <div className="bg-surface border border-edge rounded-lg p-4">
            <ul className="space-y-1 text-content">
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
          <h2 className="text-lg font-semibold text-content mb-3">Spells</h2>
          <div className="bg-surface border border-edge rounded-lg p-4">
            <ul className="space-y-1 text-content">
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
    <div className="bg-surface border border-edge rounded-lg p-3 text-center">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-bold text-heading">{value}</div>
    </div>
  );
}
