import './FragrancePyramid.css';

export default function FragrancePyramid({ notes }) {
  if (!notes || notes.length === 0) return null;

  const topNotes = notes.filter((n) => n.note_type === 'top');
  const midNotes = notes.filter((n) => n.note_type === 'mid');
  const baseNotes = notes.filter((n) => n.note_type === 'base');

  const renderNotes = (noteList, label, emoji) => {
    if (noteList.length === 0) return null;
    return (
      <div className="pyramid__layer">
        <div className="pyramid__label">
          <span className="pyramid__emoji">{emoji}</span>
          <span className="pyramid__label-text">{label}</span>
        </div>
        <div className="pyramid__notes">
          {noteList.map((pn, i) => (
            <span key={i} className="pyramid__note">
              {pn.notes?.name || 'Unknown'}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pyramid" id="fragrance-pyramid">
      <h3 className="pyramid__title">Fragrance Notes</h3>
      <div className="pyramid__layers">
        {renderNotes(topNotes, 'Top', '🍋')}
        {renderNotes(midNotes, 'Heart', '🌹')}
        {renderNotes(baseNotes, 'Base', '🪵')}
      </div>
    </div>
  );
}
