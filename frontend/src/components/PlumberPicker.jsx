import Avatar from "./Avatar";

const PlumberPicker = ({
  plumbers,
  selectedId,
  onSelect,
}) => {
  if (plumbers.length === 0) {
    return (
      <p className="book-empty">
        No plumbers available right now.
      </p>
    );
  }

  return (
    <div className="plumber-list">
      {plumbers.map((plumber) => {
        const isSelected =
          selectedId?.toString() ===
          plumber._id?.toString();

        return (
          <button
            key={plumber._id}
            type="button"
            className={`plumber-card ${
              isSelected ? "selected" : ""
            }`}
            onClick={() => onSelect(plumber)}
          >
            <Avatar
              user={plumber}
              size="md"
            />

            <div className="plumber-card-info">
              <strong>{plumber.username}</strong>
              <span>
                {plumber.serviceArea ||
                  "Local area"}
              </span>
              <span className="plumber-badge">
                {plumber.isAvailable
                  ? "Available"
                  : "Busy"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PlumberPicker;
