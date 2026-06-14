import {
  useEffect,
  useState,
} from "react";

import { searchUsers } from "../services/userService";

import Avatar from "./Avatar";

const NewChatModal = ({
  onClose,
  onSelectUser,
  existingChatUserIds,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleClose = () => {
    onClose();
  };

  const handleQueryChange = (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setSearched(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await searchUsers(
          query.trim()
        );

        setResults(data);
        setSearched(true);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Search failed"
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (foundUser) => {
    onSelectUser(foundUser);
    handleClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h3>New chat</h3>

          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          className="modal-search"
          placeholder="Search by username..."
          value={query}
          onChange={(e) =>
            handleQueryChange(e.target.value)
          }
          autoFocus
        />

        <div className="modal-results">
          {loading && (
            <p className="modal-message">
              Searching...
            </p>
          )}

          {!loading && error && (
            <p className="modal-message modal-error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            searched &&
            results.length === 0 && (
              <p className="modal-message">
                No users found
              </p>
            )}

          {!loading &&
            results.map((foundUser) => {
              const hasChat =
                existingChatUserIds.has(
                  foundUser._id
                );

              return (
                <div
                  key={foundUser._id}
                  className="user-item"
                  onClick={() =>
                    handleSelect(foundUser)
                  }
                >
                  <div className="chat-item-name">
                    <Avatar
                      user={foundUser}
                      size="sm"
                    />

                    {foundUser.username}
                  </div>

                  {hasChat && (
                    <div className="chat-item-preview">
                      Existing conversation
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
