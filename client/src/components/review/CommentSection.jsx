import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommentsByReview, createComment, deleteComment } from '../../services/commentService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../store/toastStore';
import './CommentSection.css';

export default function CommentSection({ reviewId, currentUserId, onCountChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCommentsByReview(reviewId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reviewId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const comment = await createComment(reviewId, trimmed);
      setComments((prev) => [...prev, comment]);
      setText('');
      onCountChange?.((c) => c + 1);
    } catch (err) {
      toast.error('Failed to post comment: ' + err.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange?.((c) => c - 1);
    } catch (err) {
      toast.error('Failed to delete comment: ' + err.message);
    }
  };

  return (
    <div className="comment-section">
      {loading ? (
        <p className="comment-section__loading">Loading comments…</p>
      ) : (
        <div className="comment-section__list">
          {comments.map((c) => (
            <div key={c.id} className="comment-section__item">
              <span className="comment-section__avatar">
                {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" /> : (c.profiles?.username || 'U')[0].toUpperCase()}
              </span>
              <div className="comment-section__body">
                <div className="comment-section__meta">
                  <strong>{c.profiles?.username || 'Anonymous'}</strong>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p>{c.text}</p>
              </div>
              {currentUserId === c.user_id && (
                <button type="button" className="comment-section__delete" onClick={() => handleDelete(c.id)} aria-label="Delete comment">✕</button>
              )}
            </div>
          ))}
          {comments.length === 0 && <p className="comment-section__empty">No comments yet.</p>}
        </div>
      )}

      {isAuthenticated ? (
        <form className="comment-section__form" onSubmit={handleSubmit}>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !text.trim()}>
            {submitting ? '…' : 'Post'}
          </button>
        </form>
      ) : (
        <button type="button" className="comment-section__signin" onClick={() => navigate('/login')}>
          Sign in to comment
        </button>
      )}
    </div>
  );
}
