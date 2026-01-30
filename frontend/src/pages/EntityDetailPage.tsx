import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEntity } from '../api/rulesets';
import type { RulesetEntity } from '../types';

export default function EntityDetailPage() {
  const { id: rulesetId, entityId } = useParams<{ id: string; entityId: string }>();
  const [entity, setEntity] = useState<RulesetEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rulesetId || !entityId) return;
    getEntity(rulesetId, entityId)
      .then(setEntity)
      .finally(() => setLoading(false));
  }, [rulesetId, entityId]);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!entity) return <div className="p-8 text-red-400">Entity not found</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link
        to={`/rulesets/${rulesetId}`}
        className="text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; Back to entities
      </Link>
      <h1 className="text-2xl font-bold text-gray-100 mt-1 mb-1">{entity.name}</h1>
      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded capitalize">
        {entity.entity_type}
      </span>

      <div className="mt-6">
        <EntityRenderer type={entity.entity_type} data={entity.entity_data || {}} />
      </div>
    </div>
  );
}

function EntityRenderer({
  type,
  data,
}: {
  type: string;
  data: Record<string, unknown>;
}) {
  switch (type) {
    case 'spell':
      return <SpellRenderer data={data} />;
    case 'creature':
      return <CreatureRenderer data={data} />;
    default:
      return <GenericRenderer data={data} />;
  }
}

function SpellRenderer({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoBox label="Level" value={data.level === 0 ? 'Cantrip' : String(data.level ?? '—')} />
        <InfoBox label="School" value={displayNested(data.school)} />
        <InfoBox label="Casting Time" value={String(data.casting_time ?? '—')} />
        <InfoBox label="Range" value={String(data.range ?? '—')} />
        <InfoBox label="Duration" value={String(data.duration ?? '—')} />
        <InfoBox label="Components" value={formatComponents(data)} />
        <InfoBox label="Concentration" value={data.concentration ? 'Yes' : 'No'} />
        <InfoBox label="Ritual" value={data.ritual ? 'Yes' : 'No'} />
      </div>
      {!!data.desc && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
          <p className="text-gray-200 whitespace-pre-wrap">{String(data.desc)}</p>
        </div>
      )}
      {!!data.higher_level && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">At Higher Levels</h3>
          <p className="text-gray-200 whitespace-pre-wrap">{String(data.higher_level)}</p>
        </div>
      )}
    </div>
  );
}

function CreatureRenderer({ data }: { data: Record<string, unknown> }) {
  const abilityScores = [
    { key: 'strength', label: 'STR' },
    { key: 'dexterity', label: 'DEX' },
    { key: 'constitution', label: 'CON' },
    { key: 'intelligence', label: 'INT' },
    { key: 'wisdom', label: 'WIS' },
    { key: 'charisma', label: 'CHA' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoBox label="CR" value={String(data.challenge_rating_text ?? data.cr ?? '—')} />
        <InfoBox label="Type" value={displayNested(data.type)} />
        <InfoBox label="Size" value={displayNested(data.size)} />
        <InfoBox label="Alignment" value={String(data.alignment ?? '—')} />
        <InfoBox label="AC" value={String(data.armor_class ?? '—')} />
        <InfoBox label="HP" value={String(data.hit_points ?? '—')} />
      </div>

      <div className="grid grid-cols-6 gap-2">
        {abilityScores.map(({ key, label }) => {
          const val = data[key];
          const score = typeof val === 'object' && val !== null ? (val as Record<string, unknown>).value : val;
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-lg font-bold text-gray-100">{String(score ?? '—')}</div>
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
                <span className="font-medium text-amber-400">{String(a.name ?? '')}</span>
                {!!a.desc && <span className="text-gray-300 ml-2">{String(a.desc)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GenericRenderer({ data }: { data: Record<string, unknown> }) {
  const skipKeys = ['url', 'key', 'resource'];
  const entries = Object.entries(data).filter(
    ([k, v]) => !skipKeys.includes(k) && v !== null && v !== '' && v !== undefined
  );

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-500 capitalize mb-1">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-gray-200 whitespace-pre-wrap text-sm">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-100 font-medium">{value}</div>
    </div>
  );
}

function displayNested(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.name ?? obj.value ?? JSON.stringify(val));
  }
  return String(val);
}

function formatComponents(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.requires_verbal_components) parts.push('V');
  if (data.requires_somatic_components) parts.push('S');
  if (data.requires_material_components) parts.push('M');
  return parts.length > 0 ? parts.join(', ') : String(data.components ?? '—');
}
