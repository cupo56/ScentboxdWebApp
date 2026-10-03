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

export function ratingToPercent(rating) {
  if (rating == null || rating === '') return null;
  const value = Number(rating);
  return Number.isFinite(value) ? Math.round((value / 5) * 100) : null;
}
