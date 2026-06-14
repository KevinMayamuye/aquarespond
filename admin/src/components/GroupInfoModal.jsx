import Avatar from "./Avatar";
import { formatLastSeen } from "../utils/messageStatus";

const GroupInfoModal = ({
  chat,
  onClose,
}) => {
  if (!chat) {
    return null;
  }

  const members = chat.participants || [];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal group-info-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{chat.name || "Group"}</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="group-info-count">
          {members.length} members
        </p>

        <div className="group-info-members">
          {members.map((member) => (
            <div
              key={member._id}
              className="group-info-member"
            >
              <Avatar user={member} size="sm" />

              <div className="group-info-member-text">
                <span className="group-info-member-name">
                  {member.username}
                </span>

                <span
                  className={`group-info-member-status ${
                    member.isOnline ? "online" : ""
                  }`}
                >
                  {formatLastSeen(
                    member.isOnline,
                    member.lastSeen
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
