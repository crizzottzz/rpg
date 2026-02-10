export type FieldShape =
  | 'reference'
  | 'display_string_map'
  | 'named_section_list'
  | 'desc_only_list'
  | 'reference_list'
  | 'key_value_map'
  | 'rich_text'
  | 'boolean'
  | 'scalar'
  | 'detail_object'
  | 'unknown_array'
  | 'unknown_object';

export interface ClassifiedField {
  key: string;
  value: unknown;
  shape: FieldShape;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isReference(val: unknown): boolean {
  if (!isRecord(val)) return false;
  const keys = Object.keys(val);
  return keys.includes('name') && keys.includes('key') && keys.length <= 5;
}

function isKeyValueMap(val: unknown): boolean {
  if (!isRecord(val)) return false;
  const values = Object.values(val);
  if (values.length === 0) return false;
  const primitiveCount = values.filter(
    (v) => typeof v === 'number' || typeof v === 'string'
  ).length;
  return primitiveCount / values.length >= 0.7;
}

function isDisplayStringMap(val: unknown): boolean {
  return isRecord(val) && typeof (val as Record<string, unknown>).as_string === 'string';
}

function peekArray(val: unknown[]): FieldShape {
  const first = val[0];
  if (!isRecord(first)) return 'unknown_array';

  const keys = Object.keys(first);
  const hasName = keys.includes('name');
  const hasDesc = keys.includes('desc');

  if (hasName && hasDesc) return 'named_section_list';
  if (hasDesc) return 'desc_only_list';
  if (hasName && !hasDesc && keys.length <= 4) return 'reference_list';
  return 'unknown_array';
}

function isRichText(val: string): boolean {
  return (
    val.length > 100 ||
    val.includes('\n') ||
    val.includes('**') ||
    val.includes('##') ||
    val.includes('|')
  );
}

export function detectFieldShape(_key: string, value: unknown): FieldShape {
  if (typeof value === 'boolean') return 'boolean';

  if (typeof value === 'string') {
    return isRichText(value) ? 'rich_text' : 'scalar';
  }

  if (typeof value === 'number') return 'scalar';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown_array';
    return peekArray(value);
  }

  if (isRecord(value)) {
    if (isDisplayStringMap(value)) return 'display_string_map';
    if (isReference(value)) return 'reference';
    if (isKeyValueMap(value)) return 'key_value_map';
    return 'detail_object';
  }

  return 'scalar';
}
