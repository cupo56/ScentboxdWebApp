// Vokabular für das Performance-Panel der Detailseite. Die Codes kommen aus
// perfumes.longevity_code / sillage_code; die Prozentwerte sind Balkenlängen.
const LONGEVITY = {
  very_weak: { percent: 10, label: 'Very weak' },
  weak: { percent: 25, label: 'Weak' },
  moderate: { percent: 50, label: 'Moderate' },
  long: { percent: 75, label: 'Long' },
  very_long: { percent: 90, label: 'Very long' },
};

const SILLAGE = {
  light: { percent: 30, label: 'Light' },
  moderate: { percent: 55, label: 'Moderate' },
  strong: { percent: 80, label: 'Strong' },
  enormous: { percent: 95, label: 'Enormous' },
};

export function longevityFromCode(code) {
  return LONGEVITY[code] ?? null;
}

export function sillageFromCode(code) {
  return SILLAGE[code] ?? null;
}

// Bottle- und Value-Bewertungen liegen in der DB als 0–100 (iOS schreibt
// Prozent). Alte Web-Reviews haben 1–5 geschrieben; Werte ≤ 5 gelten als Sterne.
export function ratingToPercent(rating) {
  if (rating == null || rating === '') return null;
  const value = Number(rating);
  if (!Number.isFinite(value)) return null;
  const percent = value <= 5 ? value * 20 : value;
  return Math.round(Math.min(100, Math.max(0, percent)));
}

// Umkehrung für die Sterne-Anzeige: 0–100 → 0–5 (eine Nachkommastelle), ≤ 5 bleibt.
export function ratingToStars(rating) {
  const percent = ratingToPercent(rating);
  return percent == null ? null : Math.round(percent / 20 * 10) / 10;
}

// Für das Speichern aus dem Web-Formular: Sterne (1–5) → Prozent.
export function starsToPercent(stars) {
  return stars ? Math.round(Number(stars) * 20) : null;
}
