import './Spinner.css';

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner-wrapper ${className}`}>
      <div className={`spinner spinner--${size}`} />
    </div>
  );
}
