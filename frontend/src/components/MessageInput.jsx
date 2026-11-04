import { useState } from "react";
import { ArrowUp, Smile } from "lucide-react";

function MessageInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || disabled) return;
    const sent = await onSend(content);
    if (sent) setMessage("");
  };

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <div className="composer">
        <input
          aria-label="Write a message"
          maxLength={2000}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a message…"
          value={message}
        />
        <span className="composer-hint">↵ to send</span>
        <button
          aria-label="Send message"
          className="send-button"
          disabled={!message.trim() || disabled}
          type="submit"
        >
          <ArrowUp size={19} strokeWidth={2.2} />
        </button>
      </div>
      <div className="composer-footer">
        <span><Smile size={14} /> Keep it kind. Keep it you.</span>
        <span>{message.length > 0 ? `${message.length}/2000` : " "}</span>
      </div>
    </form>
  );
}

export default MessageInput;
