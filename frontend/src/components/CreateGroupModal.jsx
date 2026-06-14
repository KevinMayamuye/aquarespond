import {
  useEffect,
  useState,
} from "react";

import { createGroupChat } from "../services/chatService";
import { searchUsers } from "../services/userService";
import { getContactsFromChats } from "../utils/chatDisplay";

import Avatar from "./Avatar";

const CreateGroupModal = ({
  onClose,
  onGroupCreated,
  chats,
  currentUserId,
}) => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMembers, setSelectedMembers] =
    useState([]);
  const [searchLoading, setSearchLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [creating, setCreating] = useState(false);

  const contacts = getContactsFromChats(
    chats,
    currentUserId
  );

  const selectedIds = new Set(
    selectedMembers.map((m) => m._id.toString())
  );

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
      setSearchLoading(true);
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
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleMember = (member) => {
    const id = member._id.toString();

    setSelectedMembers((prev) => {
      if (prev.some((m) => m._id.toString() === id)) {
        return prev.filter(
          (m) => m._id.toString() !== id
        );
      }

      return [...prev, member];
    });
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || selectedMembers.length < 2) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const chat = await createGroupChat(
        trimmedName,
        selectedMembers.map((m) => m._id)
      );

      onGroupCreated(chat);
      handleClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not create group"
      );
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    name.trim().length > 0 &&
    selectedMembers.length >= 2 &&
    !creating;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="modal create-group-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>New group</h3>

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
          placeholder="Group name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          autoFocus
        />

        {selectedMembers.length > 0 && (
          <div className="selected-members">
            {selectedMembers.map((member) => (
              <button
                key={member._id}
                type="button"
                className="member-chip"
                onClick={() =>
                  toggleMember(member)
                }
              >
                {member.username}
                <span aria-hidden="true"> ×</span>
              </button>
            ))}
          </div>
        )}

        {contacts.length > 0 && (
          <>
            <h4 className="modal-section-title">
              From your conversations
            </h4>

            <div className="modal-results">
              {contacts.map((contact) => {
                const isSelected = selectedIds.has(
                  contact._id.toString()
                );

                return (
                  <div
                    key={contact._id}
                    className={`user-item selectable ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() =>
                      toggleMember(contact)
                    }
                  >
                    <div className="chat-item-name">
                      <Avatar
                        user={contact}
                        size="sm"
                      />
                      {contact.username}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h4 className="modal-section-title">
          Search users
        </h4>

        <input
          type="text"
          className="modal-search"
          placeholder="Search by username..."
          value={query}
          onChange={(e) =>
            handleQueryChange(e.target.value)
          }
        />

        <div className="modal-results">
          {searchLoading && (
            <p className="modal-message">
              Searching...
            </p>
          )}

          {!searchLoading &&
            searched &&
            results.length === 0 && (
              <p className="modal-message">
                No users found
              </p>
            )}

          {!searchLoading &&
            results.map((foundUser) => {
              const isSelected = selectedIds.has(
                foundUser._id.toString()
              );

              return (
                <div
                  key={foundUser._id}
                  className={`user-item selectable ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() =>
                    toggleMember(foundUser)
                  }
                >
                  <div className="chat-item-name">
                    <Avatar
                      user={foundUser}
                      size="sm"
                    />
                    {foundUser.username}
                  </div>
                </div>
              );
            })}
        </div>

        {error && (
          <p className="modal-message modal-error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="create-group-btn"
          disabled={!canCreate}
          onClick={handleCreate}
        >
          {creating ? "Creating..." : "Create group"}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupModal;
