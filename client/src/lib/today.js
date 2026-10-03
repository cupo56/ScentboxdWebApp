const DAY_MS = 86_400_000;
const ORDER = { top: 0, mid: 1, base: 2 };
const byTier = (a, b) => (ORDER[a.note_type] ?? 3) - (ORDER[b.note_type] ?? 3);

const LONGEVITY_LINE = {
  very_long: 'Very long-lasting, carries into the next day.',
  long: 'Long-lasting, good for a full day.',
  weak: 'Light wear, best re-applied.',
  very_weak: 'Light wear, best re-applied.',
};

/**
 * Tagesempfehlung. Eingeloggte mit Want-to-try-Liste bekommen einen Duft
 * daraus, deterministisch pro lokalem Kalendertag (gleicher Tag → gleicher Duft).
 * Sonst Platz 1 aus Trending. Ohne Kandidaten null.
 */
export function pickOfTheDay({ trending = [], wantToTry = [], date = new Date() } = {}) {
  if (wantToTry.length > 0) {
    const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
    return { id: wantToTry[day % wantToTry.length].id, source: 'want_to_try' };
  }
  if (trending.length > 0) return { id: trending[0].id, source: 'trending' };
  return null;
}

/**
 * Ein ehrlicher Satz aus Daten statt Matching-Prozent: Familie der ersten
 * Note, die ersten drei Noten in Pyramiden-Reihenfolge, Longevity aus
 * longevity_code; moderate wird nicht erwähnt.
 * `translate` übersetzt Notennamen (siehe useNoteName).
 */
export function buildWhyText(perfume, translate = (name) => name) {
  const family = [...(perfume.perfume_notes || [])].sort(byTier).find((pn) => pn.notes?.family)?.notes.family;
  const names = [...(perfume.perfume_notes || [])]
    .filter((pn) => pn.notes?.name)
    .sort(byTier)
    .slice(0, 3)
    .map((pn) => translate(pn.notes.name));

  const parts = [];
  if (family && names.length) parts.push(`${family}, opening with ${joinNames(names)}.`);
  else if (names.length) parts.push(`Opens with ${joinNames(names)}.`);
  else if (family) parts.push(`A ${family.toLowerCase()} fragrance.`);

  const longevityLine = LONGEVITY_LINE[perfume.longevity_code];
  if (longevityLine) parts.push(longevityLine);

  return parts.length ? parts.join(' ') : 'Rated highly by the community this week.';
}

function joinNames(names) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
