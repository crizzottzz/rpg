import type { FieldShape } from '../utils/field-detection';

interface FieldValueProps {
  value: unknown;
  shape: FieldShape;
}

export default function FieldValue({ value, shape }: FieldValueProps) {
  switch (shape) {
    case 'boolean':
      return <span>{value ? 'Yes' : 'No'}</span>;

    case 'reference': {
      const obj = value as Record<string, unknown>;
      return <span>{String(obj.name ?? '—')}</span>;
    }

    case 'display_string_map': {
      const obj = value as Record<string, unknown>;
      return <span>{String(obj.as_string ?? '—')}</span>;
    }

    case 'reference_list': {
      const items = value as Array<Record<string, unknown>>;
      const names = items.map((item) => String(item.name ?? '')).filter(Boolean);
      return <span>{names.length > 0 ? names.join(', ') : '—'}</span>;
    }

    case 'scalar':
      return <span>{String(value ?? '—')}</span>;

    default:
      return <span>{String(value ?? '—')}</span>;
  }
}

export function resolveDisplayValue(value: unknown, shape: FieldShape): string {
  switch (shape) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'reference': {
      const obj = value as Record<string, unknown>;
      return String(obj.name ?? '—');
    }
    case 'display_string_map': {
      const obj = value as Record<string, unknown>;
      return String(obj.as_string ?? '—');
    }
    case 'reference_list': {
      const items = value as Array<Record<string, unknown>>;
      return items.map((item) => String(item.name ?? '')).filter(Boolean).join(', ') || '—';
    }
    case 'scalar':
      return String(value ?? '—');
    default:
      return String(value ?? '—');
  }
}
