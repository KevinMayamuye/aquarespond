import { useState } from "react";

import StarRatingInput from "./StarRatingInput";
import { submitBookingRating } from "../services/ratingService";

const RatingModal = ({
  booking,
  onClose,
  onSubmitted,
}) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!score) {
      setError("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitBookingRating(booking._id, {
        score,
        comment,
      });

      setSuccess(true);
      onSubmitted?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not submit rating"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal rating-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Rate your plumber</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success ? (
          <p className="modal-message">
            Thanks! Your rating is pending admin
            approval.
          </p>
        ) : (
          <form
            className="rating-modal-form"
            onSubmit={handleSubmit}
          >
            <p className="rating-modal-plumber">
              {booking.plumber?.username ||
                "Plumber"}
            </p>
            <p className="rating-modal-service">
              {booking.serviceType}
            </p>

            <label>
              Your rating
              <StarRatingInput
                value={score}
                onChange={setScore}
              />
            </label>

            <label htmlFor="rating-comment">
              Comment (optional)
              <textarea
                id="rating-comment"
                name="comment"
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                placeholder="Share your experience..."
                rows={3}
                maxLength={500}
              />
            </label>

            {error && (
              <p className="modal-message modal-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit rating"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RatingModal;
