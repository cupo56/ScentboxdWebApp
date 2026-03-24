import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const handler = (e) => addToast(e.detail.message, 'error');
    window.addEventListener('app:error', handler);
    return () => window.removeEventListener('app:error', handler);
  }, [addToast]);

  // Expose globally for success messages etc.
  useEffect(() => {
    window.__toast = addToast;
    return () => { delete window.__toast; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast__icon">
            {toast.type === 'error' ? '✕' : '✓'}
          </span>
          <p className="toast__message">{toast.message}</p>
          <button
            className="toast__close"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
