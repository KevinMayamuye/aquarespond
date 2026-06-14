const TypingIndicator = () => (
  <div
    className="message received typing-indicator"
    aria-label="User is typing"
  >
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
  </div>
);

export default TypingIndicator;
