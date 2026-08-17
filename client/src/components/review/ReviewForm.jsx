import { useState } from 'react';
import StarRating from './StarRating';
import { createReview, updateReview } from '../../services/reviewService';
import './ReviewForm.css';

const OCCASION_OPTIONS = ['Daily', 'Office', 'Date Night', 'Evening Out', 'Summer', 'Winter', 'Special Occasion'];

export default function ReviewForm({ perfumeId, initialData, onReviewAdded, onCancel }) {
  const [text, setText] = useState(initialData?.text || '');
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [longevity, setLongevity] = useState(initialData?.longevity ?? '');
  const [sillage, setSillage] = useState(initialData?.sillage ?? '');
  const [occasions, setOccasions] = useState(initialData?.occasions || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleOccasion = (occ) => {
    setOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || text.trim().length < 10) {
      setError('Please provide a rating and at least 10 characters of text.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const title = text.trim().slice(0, 60);
      const payload = {
        perfume_id: perfumeId,
        title,
        text: text.trim(),
        rating,
        longevity: longevity !== '' ? parseInt(longevity) : null,
        sillage: sillage !== '' ? parseInt(sillage) : null,
        occasions,
      };

      if (initialData) {
        const updated = await updateReview(initialData.id, payload);
        onReviewAdded?.(updated);
      } else {
        const review = await createReview(payload);
        onReviewAdded?.(review);
        setText('');
        setRating(0);
        setLongevity('');
        setSillage('');
        setOccasions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <form className="composer" onSubmit={handleSubmit} id="review-form">
      <h3 className="composer__title">{initialData ? 'Edit Review' : 'Write a Review'}</h3>

      {error && <p className="composer__error">{error}</p>}

      <div className="composer__rating">
        <label>Rating</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="composer__field">
        <label>Review</label>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts about this fragrance..."
          minLength={10}
          maxLength={500}
        />
        <span className="composer__charcount">{text.length}/500</span>
      </div>

      <div className="composer__row">
        <div className="composer__field">
          <label>Longevity (0-100%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={longevity}
            onChange={(e) => setLongevity(e.target.value)}
            placeholder="0-100"
          />
        </div>
        <div className="composer__field">
          <label>Sillage (0-100%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={sillage}
            onChange={(e) => setSillage(e.target.value)}
            placeholder="0-100"
          />
        </div>
      </div>

      <div className="composer__field">
        <label>Best for</label>
        <div className="composer__occasions">
          {OCCASION_OPTIONS.map((occ) => (
            <button
              key={occ}
              type="button"
              className={`composer__occ-btn ${occasions.includes(occ) ? 'active' : ''}`}
              onClick={() => toggleOccasion(occ)}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      <div className="composer__actions" style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : (initialData ? 'Save changes' : 'Post verdict')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-lg" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
