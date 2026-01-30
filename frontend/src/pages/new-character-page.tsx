import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampaign } from '../api/campaigns';
import { listEntities } from '../api/rulesets';
import { createCharacter } from '../api/characters';
import type { Campaign, RulesetEntity, AbilityScores } from '../types';

const ABILITY_KEYS: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export default function NewCharacterPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [species, setSpecies] = useState<RulesetEntity[]>([]);
  const [classes, setClasses] = useState<RulesetEntity[]>([]);

  const [name, setName] = useState('');
  const [charType, setCharType] = useState<'pc' | 'npc'>('pc');
  const [level, setLevel] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [scores, setScores] = useState<AbilityScores>({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    getCampaign(campaignId).then((c) => {
      setCampaign(c);
      listEntities(c.ruleset_id, { type: 'species', per_page: 100 }).then((d) =>
        setSpecies(d.entities)
      );
      listEntities(c.ruleset_id, { type: 'class', per_page: 100 }).then((d) =>
        setClasses(d.entities)
      );
    });
  }, [campaignId]);

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
      navigate(`/characters/${character.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!campaign) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-xl">
      <Link
        to={`/campaigns/${campaignId}`}
        className="text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; {campaign.name}
      </Link>
      <h1 className="text-2xl font-bold text-gray-100 mt-1 mb-6">New Character</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select
              value={charType}
              onChange={(e) => setCharType(e.target.value as 'pc' | 'npc')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
            >
              <option value="pc">Player Character</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Level</label>
            <input
              type="number"
              min={1}
              max={20}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Species</label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
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
            <label className="block text-sm text-gray-400 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
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
          <label className="block text-sm text-gray-400 mb-2">Ability Scores</label>
          <div className="grid grid-cols-3 gap-3">
            {ABILITY_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {ABILITY_LABELS[key]}
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={scores[key]}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 text-center focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
