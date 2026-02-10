const SKIP_KEYS = new Set([
  'url',
  'key',
  'resource',
  'document',
  'name',
]);

const PRIORITY_ORDER: string[] = [
  'desc',
  'type',
  'category',
  'level',
  'hit_dice',
  'caster_type',
  'school',
  'casting_time',
  'range',
  'range_text',
  'duration',
  'verbal',
  'somatic',
  'material',
  'material_specified',
  'concentration',
  'ritual',
  'higher_level',
  'challenge_rating_text',
  'armor_class',
  'hit_points',
  'alignment',
  'ability_scores',
  'modifiers',
  'speed',
  'saving_throws',
  'saving_throws_all',
  'skill_bonuses',
  'skill_bonuses_all',
  'passive_perception',
  'senses',
  'languages',
  'prerequisite',
  'has_prerequisite',
  'is_subspecies',
  'subspecies_of',
  'is_magic_item',
  'rarity',
  'cost',
  'weight',
  'weight_unit',
  'weapon',
  'armor',
  'traits',
  'actions',
  'features',
  'benefits',
  'descriptions',
];

export function shouldSkip(key: string): boolean {
  return SKIP_KEYS.has(key);
}

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function sortFields(
  entries: [string, unknown][]
): [string, unknown][] {
  return [...entries].sort(([a], [b]) => {
    const ai = PRIORITY_ORDER.indexOf(a);
    const bi = PRIORITY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}
