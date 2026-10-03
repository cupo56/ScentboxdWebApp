// Vokabular für Catalog-Filter. perfumes.longevity ist deutscher Text,
// perfumes.longevity_code das stabile Vokabular; die UI zeigt englische Labels.
export const LONGEVITY_OPTIONS = [
  { code: 'moderate', label: 'Moderate', rpcLabel: 'Moderat' },
  { code: 'long', label: 'Long', rpcLabel: 'Langhaltend' },
  { code: 'very_long', label: 'Very long', rpcLabel: 'Sehr langhaltend' },
];

export function longevityLabel(code) {
  return LONGEVITY_OPTIONS.find((o) => o.code === code)?.label ?? code;
}

// Die RPC get_perfumes_by_notes filtert noch über den deutschen Text
// (p.longevity ilike p_longevity). Bis sie auf longevity_code umgestellt ist,
// bekommt sie das Hauptlabel; die vier Zeilen mit "Lang" fallen bei long durch.
export function longevityRpcLabel(code) {
  return LONGEVITY_OPTIONS.find((o) => o.code === code)?.rpcLabel ?? null;
}

export const SORT_OPTIONS = [
  { value: 'performance', label: 'Best rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export function sortLabel(value) {
  return SORT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
