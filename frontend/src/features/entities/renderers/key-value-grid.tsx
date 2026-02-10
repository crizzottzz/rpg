import { formatLabel } from '../utils/field-formatting';

interface KeyValueGridProps {
  label: string;
  data: Record<string, unknown>;
}

export default function KeyValueGrid({ label, data }: KeyValueGridProps) {
  const entries = Object.entries(data).filter(
    ([k, v]) => v !== null && v !== undefined && k !== 'unit'
  );

  if (entries.length === 0) return null;

  const unit = typeof data.unit === 'string' ? ` ${data.unit}` : '';

  return (
    <div>
      <h3 className="text-sm font-semibold text-label mb-2">{label}</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {entries.map(([key, value]) => {
          const display =
            typeof value === 'number' || typeof value === 'string'
              ? `${value}${typeof value === 'number' && unit ? unit : ''}`
              : '—';
          return (
            <div
              key={key}
              className="bg-surface border border-edge rounded-lg p-2 text-center"
            >
              <div className="text-xs text-muted">{formatLabel(key)}</div>
              <div className="text-lg font-bold text-heading">{display}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
