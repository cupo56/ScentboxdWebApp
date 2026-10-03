// Fixe, rein dekorative Hintergrund-Ebene. Das CSS steht in index.css
// (.aurora), damit es ohne Import auf allen Seiten gilt.
export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--magenta" />
      <div className="aurora__blob aurora__blob--gold" />
    </div>
  );
}
