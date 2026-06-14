const TypingIndicator = () => (
  <div
    className="message received typing-indicator"
    role="status"
    aria-live="polite"
  >
    <span className="visually-hidden">
      User is typing
    </span>
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
  </div>
);

export default TypingIndicator;
