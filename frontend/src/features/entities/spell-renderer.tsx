import InfoBox from './renderers/info-box';
import { renderMarkdown } from './utils/markdown';

interface SpellRendererProps {
  data: Record<string, unknown>;
}

export default function SpellRenderer({ data }: SpellRendererProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoBox
          label="Level"
          value={data.level === 0 ? 'Cantrip' : String(data.level ?? '—')}
        />
        <InfoBox label="School" value={displayNested(data.school)} />
        <InfoBox
          label="Casting Time"
          value={String(data.casting_time ?? '—')}
        />
        <InfoBox
          label="Range"
          value={String(data.range_text ?? data.range ?? '—')}
        />
        <InfoBox label="Duration" value={String(data.duration ?? '—')} />
        <InfoBox label="Components" value={formatComponents(data)} />
        <InfoBox
          label="Concentration"
          value={data.concentration ? 'Yes' : 'No'}
        />
        <InfoBox label="Ritual" value={data.ritual ? 'Yes' : 'No'} />
      </div>
      {!!data.desc && (
        <div className="bg-surface border border-edge rounded-lg p-4">
          <h3 className="text-sm font-semibold text-label mb-2">
            Description
          </h3>
          <div className="text-content text-sm">
            {renderMarkdown(String(data.desc))}
          </div>
        </div>
      )}
      {!!data.higher_level && (
        <div className="bg-surface border border-edge rounded-lg p-4">
          <h3 className="text-sm font-semibold text-label mb-2">
            At Higher Levels
          </h3>
          <div className="text-content text-sm">
            {renderMarkdown(String(data.higher_level))}
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

function formatComponents(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.verbal) parts.push('V');
  if (data.somatic) parts.push('S');
  if (data.material) parts.push('M');
  if (parts.length === 0) return '—';
  let result = parts.join(', ');
  if (data.material && data.material_specified) {
    result += ` (${String(data.material_specified)})`;
  }
  return result;
}
