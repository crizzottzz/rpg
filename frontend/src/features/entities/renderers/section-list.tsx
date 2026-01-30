import { formatLabel } from '../utils/field-formatting';
import { renderMarkdown } from '../utils/markdown';

interface SectionListProps {
  label: string;
  items: Array<Record<string, unknown>>;
  variant: 'named' | 'desc_only';
}

const META_KEYS = new Set(['name', 'desc', 'url', 'key', 'resource', 'document']);

export default function SectionList({ label, items, variant }: SectionListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">{label}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <SectionItem key={i} item={item} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function SectionItem({
  item,
  variant,
}: {
  item: Record<string, unknown>;
  variant: 'named' | 'desc_only';
}) {
  const name = variant === 'named' ? String(item.name ?? '') : '';
  const desc = typeof item.desc === 'string' ? item.desc : '';

  const metaEntries = Object.entries(item).filter(
    ([k, v]) => !META_KEYS.has(k) && v !== null && v !== undefined && v !== ''
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {name && (
        <h4 className="font-medium text-amber-400 mb-1">{name}</h4>
      )}
      {desc && (
        <div className="text-gray-300 text-sm">{renderMarkdown(desc)}</div>
      )}
      {metaEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {metaEntries.map(([key, value]) => (
            <span
              key={key}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded"
            >
              {formatLabel(key)}: {formatMetaValue(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMetaValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === 'object' && v !== null
          ? String((v as Record<string, unknown>).name ?? JSON.stringify(v))
          : String(v)
      )
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return String(obj.name ?? obj.value ?? JSON.stringify(value));
  }
  return String(value);
}
