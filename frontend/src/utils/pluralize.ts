const IRREGULARS: Record<string, string> = {
  species: 'species',
};

export function pluralize(word: string): string {
  const lower = word.toLowerCase();
  if (IRREGULARS[lower]) return IRREGULARS[lower];
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return word + 'es';
  }
  if (lower.endsWith('y') && !/[aeiou]y$/i.test(lower)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}
