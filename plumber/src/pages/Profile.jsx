import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getMyRatingSummary } from "../services/ratingService";

import "../styles/shell.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getMyRatingSummary()
      .then((data) => {
        if (!cancelled) {
          setRatings(data);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (value) =>
    new Date(value).toLocaleDateString();

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>My profile</h1>

        <div className="profile-field">
          <label>Username</label>
          <p>{user?.username}</p>
        </div>

        <div className="profile-field">
          <label>Email</label>
          <p>{user?.email}</p>
        </div>

        <div className="profile-field">
          <label>Phone</label>
          <p>{user?.phone || "—"}</p>
        </div>

        <div className="profile-field">
          <label>Service area</label>
          <p>{user?.serviceArea || "—"}</p>
        </div>

        <div className="profile-field">
          <label>Rating</label>
          {ratings ? (
            ratings.ratingCount > 0 ? (
              <p>
                {ratings.averageRating?.toFixed(1)} ★
                ({ratings.ratingCount}{" "}
                {ratings.ratingCount === 1
                  ? "review"
                  : "reviews"})
              </p>
            ) : (
              <p>No approved reviews yet.</p>
            )
          ) : (
            <p>Loading ratings...</p>
          )}
        </div>

        {ratings?.reviews?.length > 0 && (
          <div className="profile-reviews">
            <h2>Recent reviews</h2>
            <ul>
              {ratings.reviews.map((review, index) => (
                <li key={index}>
                  <div className="review-stars">
                    {"★".repeat(review.score)}
                    {"☆".repeat(5 - review.score)}
                  </div>
                  {review.comment && (
                    <p>{review.comment}</p>
                  )}
                  <span className="review-date">
                    {formatDate(review.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          className="profile-logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
