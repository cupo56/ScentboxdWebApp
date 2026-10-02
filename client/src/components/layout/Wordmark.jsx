import './Wordmark.css';

// Wortzeichen wie auf der Waitlist: klein geschrieben, "boxd" in Magenta.
export default function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`.trim()}>
      scent<span className="wordmark__accent">boxd</span>
    </span>
  );
}
