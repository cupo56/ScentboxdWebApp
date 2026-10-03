const DAY_MS = 86_400_000;
const ORDER = { top: 0, mid: 1, base: 2 };

/**
 * Tagesempfehlung. Eingeloggte mit Want-to-try-Liste bekommen einen Duft
 * daraus, deterministisch pro Kalendertag (gleicher Tag → gleicher Duft).
 * Sonst Platz 1 aus Trending. Ohne Kandidaten null.
 */
export function pickOfTheDay({ trending = [], wantToTry = [], date = new Date() }) {
  if (wantToTry.length > 0) {
    const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
    return { id: wantToTry[day % wantToTry.length].id, source: 'want_to_try' };
  }
  if (trending.length > 0) return { id: trending[0].id, source: 'trending' };
  return null;
}

/**
 * Ein ehrlicher Satz aus Daten statt Matching-Prozent: Familie der ersten
 * Note, die ersten drei Noten in Pyramiden-Reihenfolge, Longevity.
 * `translate` übersetzt Notennamen (siehe useNoteName).
 */
export function buildWhyText(perfume, translate = (name) => name) {
  const ordered = [...(perfume.perfume_notes || [])]
    .filter((pn) => pn.notes?.name)
    .sort((a, b) => (ORDER[a.note_type] ?? 3) - (ORDER[b.note_type] ?? 3));
  const names = ordered.slice(0, 3).map((pn) => translate(pn.notes.name));
  const family = ordered.find((pn) => pn.notes.family)?.notes.family;

  const parts = [];
  if (family && names.length) parts.push(`${family} with ${joinNames(names)} up top.`);
  else if (names.length) parts.push(`Opens with ${joinNames(names)}.`);
  else if (family) parts.push(`A ${family.toLowerCase()} fragrance.`);

  const longevity = (perfume.longevity || '').toLowerCase();
  if (longevity.includes('long') || longevity.includes('eternal')) parts.push('Long-lasting, good for a full day.');
  else if (longevity.includes('moderate')) parts.push('Moderate longevity, easy to re-apply.');
  else if (longevity) parts.push(`${perfume.longevity} longevity.`);

  return parts.length ? parts.join(' ') : 'Rated highly by the community this week.';
}

function joinNames(names) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
