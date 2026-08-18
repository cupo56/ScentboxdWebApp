import { useState } from 'react';
import { createReport } from '../../services/reportService';
import { toast } from '../../store/toastStore';
import './ReportModal.css';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'beleidigung', label: 'Harassment or abuse' },
  { value: 'unangemessen', label: 'Inappropriate content' },
  { value: 'sonstiges', label: 'Something else' },
];

export default function ReportModal({ contentType, contentId = null, reportedUserId, onClose }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await createReport({ contentType, contentId, reportedUserId, reason, details: details.trim() || null });
      toast.success('Report submitted. Thanks for the heads-up.');
      onClose();
    } catch (err) {
      toast.error('Failed to submit report: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal__header">
          <h2>Report {contentType === 'review' ? 'review' : 'profile'}</h2>
          <button type="button" className="report-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="report-modal__body" onSubmit={handleSubmit}>
          <div className="report-modal__reasons">
            {REASONS.map((r) => (
              <label key={r.value} className="report-modal__reason">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>

          <textarea
            className="input"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details (optional)"
            maxLength={500}
          />

          <div className="report-modal__actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
