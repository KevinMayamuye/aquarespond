const StarRatingInput = ({
  value,
  onChange,
}) => {
  return (
    <div
      className="star-rating-input"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          className={`star-btn ${
            value >= star ? "filled" : ""
          }`}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;
