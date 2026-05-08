import { useState } from 'react';
import StarRating from './StarRating';
import { createReview, updateReview } from '../../services/reviewService';
import './ReviewForm.css';

const OCCASION_OPTIONS = ['Daily', 'Office', 'Date Night', 'Evening Out', 'Summer', 'Winter', 'Special Occasion'];

export default function ReviewForm({ perfumeId, initialData, onReviewAdded, onCancel }) {
  const [title, setTitle] = useState(initialData?.title || '');
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
    if (!rating || !title.trim() || text.trim().length < 10) {
      setError('Please provide a rating, title, and at least 10 characters of text.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        perfume_id: perfumeId,
        title: title.trim(),
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
        setTitle('');
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
    <form className="review-form" onSubmit={handleSubmit} id="review-form">
      <h3 className="review-form__title">{initialData ? 'Edit Review' : 'Write a Review'}</h3>

      {error && <p className="review-form__error">{error}</p>}

      <div className="review-form__rating">
        <label>Rating</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="review-form__field">
        <label>Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience..."
          maxLength={100}
        />
      </div>

      <div className="review-form__field">
        <label>Review</label>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts about this fragrance..."
          minLength={10}
          maxLength={500}
        />
        <span className="review-form__charcount">{text.length}/500</span>
      </div>

      <div className="review-form__row">
        <div className="review-form__field">
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
        <div className="review-form__field">
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

      <div className="review-form__field">
        <label>Best for</label>
        <div className="review-form__occasions">
          {OCCASION_OPTIONS.map((occ) => (
            <button
              key={occ}
              type="button"
              className={`review-form__occ-btn ${occasions.includes(occ) ? 'active' : ''}`}
              onClick={() => toggleOccasion(occ)}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      <div className="review-form__actions" style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : (initialData ? 'Save Changes' : 'Submit Review')}
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
