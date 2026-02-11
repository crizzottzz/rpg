import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Spinner from '../components/spinner';
import { getCampaign } from '../api/campaigns';
import { listEntities } from '../api/rulesets';
import { createCharacter } from '../api/characters';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';
import type { PaginatedResponse, RulesetEntity } from '../types';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const ABILITY_LABELS: Record<(typeof ABILITY_KEYS)[number], string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const abilityScore = z.number().int().min(1).max(30);

const characterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  character_type: z.enum(['pc', 'npc']),
  level: z.number().int().min(1).max(20),
  species: z.string().min(1, 'Select a species'),
  class_name: z.string().min(1, 'Select a class'),
  str: abilityScore,
  dex: abilityScore,
  con: abilityScore,
  int: abilityScore,
  wis: abilityScore,
  cha: abilityScore,
});

type CharacterForm = z.infer<typeof characterSchema>;

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

  const speciesList = speciesData?.entities ?? [];
  const classList = classData?.entities ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      character_type: 'pc',
      level: 1,
      species: '',
      class_name: '',
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    },
  });

  const onSubmit = async (data: CharacterForm) => {
    if (!campaignId) return;
    const scores = { str: data.str, dex: data.dex, con: data.con, int: data.int, wis: data.wis, cha: data.cha };
    const character = await createCharacter(campaignId, {
      name: data.name,
      character_type: data.character_type,
      level: data.level,
      core_data: {
        ability_scores: scores,
        species: data.species,
        hp_max: 10 + Math.floor((data.con - 10) / 2),
        hp_current: 10 + Math.floor((data.con - 10) / 2),
        ac: 10 + Math.floor((data.dex - 10) / 2),
        speed: 30,
        proficiency_bonus: Math.ceil(data.level / 4) + 1,
      },
      class_data: { name: data.class_name },
    });
    invalidateCache('listCharacters');
    invalidateCache('listAllCharacters');
    navigate(`/characters/${character.id}`);
  };

  if (!campaign) return <Spinner />;

  const inputClass =
    'w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent';

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <Link
        to={`/campaigns/${campaignId}`}
        className="text-sm text-muted hover:text-content"
      >
        &larr; {campaign.name}
      </Link>
      <h1 className="text-2xl font-bold text-heading mt-1 mb-6">New Character</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-label mb-1">Name</label>
          <input
            type="text"
            {...register('name')}
            className={inputClass}
            autoFocus
          />
          {errors.name && (
            <p className="text-sm text-danger mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-label mb-1">Type</label>
            <select {...register('character_type')} className={inputClass}>
              <option value="pc">Player Character</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-label mb-1">Level</label>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={20}
                  className={inputClass}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-label mb-1">Species</label>
            <select {...register('species')} className={inputClass}>
              <option value="">Select...</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.species && (
              <p className="text-sm text-danger mt-1">{errors.species.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-label mb-1">Class</label>
            <select {...register('class_name')} className={inputClass}>
              <option value="">Select...</option>
              {classList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.class_name && (
              <p className="text-sm text-danger mt-1">{errors.class_name.message}</p>
            )}
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
                <Controller
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      min={1}
                      max={30}
                      className={`${inputClass} text-center`}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
