import InfoBox from './renderers/info-box';
import { renderMarkdown } from './utils/markdown';

interface CreatureRendererProps {
  data: Record<string, unknown>;
}

const ABILITY_SCORES = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
];

export default function CreatureRenderer({ data }: CreatureRendererProps) {
  const abilitySource =
    typeof data.ability_scores === 'object' && data.ability_scores !== null
      ? (data.ability_scores as Record<string, unknown>)
      : data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoBox
          label="CR"
          value={String(data.challenge_rating_text ?? data.cr ?? '—')}
        />
        <InfoBox label="Type" value={displayNested(data.type)} />
        <InfoBox label="Size" value={displayNested(data.size)} />
        <InfoBox label="Alignment" value={String(data.alignment ?? '—')} />
        <InfoBox label="AC" value={String(data.armor_class ?? '—')} />
        <InfoBox label="HP" value={String(data.hit_points ?? '—')} />
      </div>

      <div className="grid grid-cols-6 gap-2">
        {ABILITY_SCORES.map(({ key, label }) => {
          const val = abilitySource[key];
          const score =
            typeof val === 'object' && val !== null
              ? (val as Record<string, unknown>).value
              : val;
          return (
            <div
              key={key}
              className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-center"
            >
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-lg font-bold text-gray-100">
                {String(score ?? '—')}
              </div>
            </div>
          );
        })}
      </div>

      {Array.isArray(data.actions) && data.actions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Actions</h3>
          <div className="space-y-2">
            {(data.actions as Array<Record<string, unknown>>).map((a, i) => (
              <div key={i}>
                <span className="font-medium text-amber-400">
                  {String(a.name ?? '')}
                </span>
                {!!a.desc && (
                  <div className="text-gray-300 text-sm ml-0 mt-1">
                    {renderMarkdown(String(a.desc))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(data.traits) && data.traits.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Traits</h3>
          <div className="space-y-2">
            {(data.traits as Array<Record<string, unknown>>).map((t, i) => (
              <div key={i}>
                <span className="font-medium text-amber-400">
                  {String(t.name ?? '')}
                </span>
                {!!t.desc && (
                  <div className="text-gray-300 text-sm mt-1">
                    {renderMarkdown(String(t.desc))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function displayNested(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.name ?? obj.value ?? '—');
  }
  return String(val);
}
