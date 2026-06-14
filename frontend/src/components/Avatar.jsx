const COLORS = [
  "#0078ff",
  "#25d366",
  "#e67e22",
  "#9b59b6",
  "#e74c3c",
  "#16a085",
];

const getInitials = (username = "") => {
  const parts = username.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[1][0]
    ).toUpperCase();
  }

  return username.slice(0, 2).toUpperCase();
};

const getColor = (username = "") => {
  let hash = 0;

  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return COLORS[Math.abs(hash) % COLORS.length];
};

const Avatar = ({ user, size = "md", className = "" }) => {
  const username = user?.username ?? "?";
  const sizeClass = `avatar-${size}`;

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={username}
        className={`avatar ${sizeClass} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      className={`avatar avatar-fallback ${sizeClass} ${className}`.trim()}
      style={{ backgroundColor: getColor(username) }}
      aria-hidden="true"
    >
      {getInitials(username)}
    </span>
  );
};

export default Avatar;
