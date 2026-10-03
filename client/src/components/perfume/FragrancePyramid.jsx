import { Drop, Leaf, Wind } from '@phosphor-icons/react';
import { useNoteName } from '../../hooks/useNoteName';
import './FragrancePyramid.css';

const TIERS = [
  { key: 'top', label: 'Top', Icon: Wind },
  { key: 'mid', label: 'Heart', Icon: Leaf },
  { key: 'base', label: 'Base', Icon: Drop },
];

// Duftpyramide wie in der App: drei Glas-Zeilen mit Icon-Kreis, Label und
// den Noten als Text (übersetzt über useNoteName).
export default function FragrancePyramid({ notes }) {
  const noteName = useNoteName();
  const rows = TIERS.map((tier) => ({
    ...tier,
    names: (notes || [])
      .filter((pn) => pn.note_type === tier.key && pn.notes?.name)
      .map((pn) => noteName(pn.notes.name)),
  })).filter((row) => row.names.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="pyramid">
      <h2 className="pyramid__title">Fragrance pyramid</h2>
      <div className="pyramid__rows">
        {rows.map((row) => {
          const { key, label, names } = row;
          const Icon = row.Icon;
          return (
            <div key={key} className="pyramid__row glass">
              <span className="pyramid__icon" aria-hidden="true"><Icon size={18} /></span>
              <span className="pyramid__label">{label}</span>
              <span className="pyramid__notes">{names.join(', ')}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
