// src/pages/marketplace/ReviewSection.tsx
import React, { useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';
import './ReviewSection.css';

export interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
}

interface ReviewSectionProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews: number;
  productId?: string;               // optional: for submitting review
  currentUser?: { id: string; name: string }; // optional: to check if logged in
  onReviewAdded?: () => void;       // callback to refresh reviews after submission
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  averageRating = 0,
  totalReviews = 0,
  productId,
  currentUser,
  onReviewAdded,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !currentUser) {
      setError('You must be logged in to submit a review');
      return;
    }
    if (!reviewText.trim()) {
      setError('Please enter your review');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabaseAdmin.from('reviews').insert({
        product_id: productId,
        user_id: currentUser.id,
        rating,
        text: reviewText,
        verified: false, // can be set later by admin
      });
      if (insertError) throw insertError;

      // Reset form and close it
      setReviewText('');
      setRating(5);
      setShowForm(false);
      // Notify parent to refresh reviews
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    const stars = [1, 2, 3, 4, 5];
    if (interactive) {
      return (
        <div className="star-rating interactive">
          {stars.map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "filled" : ""}`}
              onClick={() => onChange?.(star)}
              style={{ cursor: 'pointer' }}
            >
              {star <= rating ? "★" : "☆"}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="star-rating">
        {stars.map((star) => (
          <span key={star} className={`star ${star <= rating ? "filled" : ""}`}>
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      <div className="review-header">
        <h3>Customer Reviews</h3>
        <div className="rating-summary">
          <div className="average-rating">
            {averageRating.toFixed(1)}
            <span className="max-rating">/5</span>
          </div>
          {renderStars(Math.round(averageRating))}
          <span className="total-reviews">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Write a review button */}
      {productId && currentUser && (
        <div className="write-review">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="write-review-button">
              Write a Review
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="review-form">
              <div className="form-group">
                <label>Your Rating</label>
                {renderStars(rating, true, setRating)}
              </div>
              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  disabled={submitting}
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="form-buttons">
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="reviewer-info">
                <div className="avatar">
                  {review.user.avatar ? (
                    <img src={review.user.avatar} alt={review.user.name} />
                  ) : (
                    review.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="reviewer-details">
                  <strong>{review.user.name}</strong>
                  {review.user.role && <span className="reviewer-role">{review.user.role}</span>}
                  {review.verified && <span className="verified-badge">Verified Buyer</span>}
                </div>
              </div>

              <div className="review-content">
                <div className="review-meta">
                  {renderStars(review.rating)}
                  <span className="review-date">
                    {new Date(review.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;