const StarRatingDisplay = ({
  averageRating,
  ratingCount,
  size = "sm",
}) => {
  if (!ratingCount) {
    return (
      <span className="star-rating-display empty">
        No reviews yet
      </span>
    );
  }

  const filledStars = Math.round(averageRating ?? 0);

  return (
    <span
      className={`star-rating-display size-${size}`}
    >
      <span className="star-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= filledStars
                ? "star filled"
                : "star"
            }
          >
            ★
          </span>
        ))}
      </span>
      <span className="star-rating-meta">
        {averageRating?.toFixed(1)} ({ratingCount}{" "}
        {ratingCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
};

export default StarRatingDisplay;
