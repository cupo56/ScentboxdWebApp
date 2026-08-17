import './FragrancePyramid.css';

export default function FragrancePyramid({ notes }) {
  if (!notes || notes.length === 0) return null;

  const rows = [
    { key: 'top', label: 'Top', list: notes.filter((n) => n.note_type === 'top') },
    { key: 'mid', label: 'Heart', list: notes.filter((n) => n.note_type === 'mid') },
    { key: 'base', label: 'Base', list: notes.filter((n) => n.note_type === 'base') },
  ].filter((row) => row.list.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="pyramid">
      <div className="pyramid__label-row">Notes</div>
      {rows.map((row) => (
        <div key={row.key} className="pyramid__row">
          <span className="pyramid__row-label">{row.label}</span>
          <div className="pyramid__row-notes">
            {row.list.map((pn, i) => (
              <span key={i} className="chip">{pn.notes?.name || 'Unknown'}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
