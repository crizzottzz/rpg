import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampaign } from '../api/campaigns';
import { listEntities } from '../api/rulesets';
import { createCharacter } from '../api/characters';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';
import type { AbilityScores, PaginatedResponse, RulesetEntity } from '../types';

const ABILITY_KEYS: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

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

export default function NewCharacterPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const { data: campaign } = useApiCache(
    getCampaign,
    [campaignId!],
    { enabled: !!campaignId },
  );

  const { data: speciesData } = useApiCache<PaginatedResponse<RulesetEntity>>(
    listEntities,
    [campaign?.ruleset_id!, { type: 'species', per_page: 100 }],
    { enabled: !!campaign?.ruleset_id },
  );

  const { data: classData } = useApiCache<PaginatedResponse<RulesetEntity>>(
    listEntities,
    [campaign?.ruleset_id!, { type: 'class', per_page: 100 }],
    { enabled: !!campaign?.ruleset_id },
  );

  const species = speciesData?.entities ?? [];
  const classes = classData?.entities ?? [];

  const [name, setName] = useState('');
  const [charType, setCharType] = useState<'pc' | 'npc'>('pc');
  const [level, setLevel] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [scores, setScores] = useState<AbilityScores>({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId || !name.trim()) return;
    setSubmitting(true);
    try {
      const character = await createCharacter(campaignId, {
        name: name.trim(),
        character_type: charType,
        level,
        core_data: {
          ability_scores: scores,
          species: selectedSpecies,
          hp_max: 10 + Math.floor((scores.con - 10) / 2),
          hp_current: 10 + Math.floor((scores.con - 10) / 2),
          ac: 10 + Math.floor((scores.dex - 10) / 2),
          speed: 30,
          proficiency_bonus: Math.ceil(level / 4) + 1,
        },
        class_data: { name: selectedClass },
      });
      invalidateCache('listCharacters');
      navigate(`/characters/${character.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!campaign) return <div className="p-8 text-label">Loading...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link
        to={`/campaigns/${campaignId}`}
        className="text-sm text-muted hover:text-content"
      >
        &larr; {campaign.name}
      </Link>
      <h1 className="text-2xl font-bold text-heading mt-1 mb-6">New Character</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-label mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-label mb-1">Type</label>
            <select
              value={charType}
              onChange={(e) => setCharType(e.target.value as 'pc' | 'npc')}
              className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
            >
              <option value="pc">Player Character</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-label mb-1">Level</label>
            <NumericInput
              value={level}
              onChange={setLevel}
              min={1}
              max={20}
              className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-label mb-1">Species</label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
            >
              <option value="">Select...</option>
              {species.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-label mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent"
            >
              <option value="">Select...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-label mb-2">Ability Scores</label>
          <div className="grid grid-cols-3 gap-3">
            {ABILITY_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-xs text-muted mb-1">
                  {ABILITY_LABELS[key]}
                </label>
                <NumericInput
                  value={scores[key]}
                  onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
                  min={1}
                  max={30}
                  className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading text-center focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
