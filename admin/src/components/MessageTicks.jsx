const MessageTicks = ({ status }) => {
  if (status === "sent") {
    return (
      <span
        className="message-ticks sent"
        title="Sent"
      >
        ✓
      </span>
    );
  }

  return (
    <span
      className={`message-ticks ${status}`}
      title={
        status === "read"
          ? "Read"
          : "Delivered"
      }
    >
      ✓✓
    </span>
  );
};

export default MessageTicks;
