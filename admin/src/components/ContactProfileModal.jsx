import { useEffect, useState } from "react";

import Avatar from "./Avatar";

import { getUserById } from "../services/userService";
import { formatLastSeen } from "../utils/messageStatus";

const ContactProfileModal = ({
  userId,
  initialUser,
  onClose,
}) => {
  const [profile, setProfile] = useState(
    initialUser ?? null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);

      try {
        const data = await getUserById(userId);

        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(
            (prev) => prev ?? initialUser ?? null
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, initialUser]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(
        [],
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Profile</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading && !profile && (
          <p className="modal-message">Loading...</p>
        )}

        {profile && (
          <div className="profile-modal-body">
            <Avatar
              user={profile}
              size="lg"
            />

            <h4 className="profile-modal-name">
              {profile.username}
            </h4>

            <p
              className={`profile-modal-status ${
                profile.isOnline ? "online" : ""
              }`}
            >
              {formatLastSeen(
                profile.isOnline,
                profile.lastSeen
              )}
            </p>

            {memberSince && (
              <p className="profile-modal-meta">
                Member since {memberSince}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactProfileModal;
