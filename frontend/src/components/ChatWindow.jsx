import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, MessageCircle } from "lucide-react";

import api, { refreshAccessToken } from "../api/axios";
import {
  formatMessageTime,
  getConversationTitle,
  getConversationUser,
  getInitials,
} from "../utils/conversations";
import MessageInput from "./MessageInput";

function Avatar({ name, image, online = false }) {
  return (
    <span className="avatar avatar-large chat-avatar">
      {image ? <img alt="" src={image} /> : <span>{getInitials(name)}</span>}
      {online && <i className="online-dot" />}
    </span>
  );
}

function mergeMessages(first, second) {
  const messages = new Map(
    [...first, ...second].map((message) => [message.id, message]),
  );
  return [...messages.values()].sort(
    (left, right) =>
      new Date(left.created_at).getTime() -
      new Date(right.created_at).getTime(),
  );
}

function ChatWindow({
  conversation,
  user,
  accessToken,
  onBack,
  onNewMessage,
}) {
  const [messageData, setMessageData] = useState({
    conversationId: null,
    messages: [],
    error: "",
    loading: true,
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [connection, setConnection] = useState("disconnected");
  const socketRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const conversationId = conversation?.id;
  const participant = getConversationUser(conversation, user?.id);
  const title = getConversationTitle(conversation, user?.id);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    let active = true;

    api
      .get(`chat/${conversationId}/messages/`)
      .then(({ data }) => {
        if (active) {
          setMessageData((current) => ({
            conversationId,
            messages: mergeMessages(
              data,
              current.conversationId === conversationId ? current.messages : [],
            ),
            error: "",
            loading: false,
          }));
        }
      })
      .catch(() => {
        if (active) {
          setMessageData((current) => ({
            conversationId,
            messages:
              current.conversationId === conversationId ? current.messages : [],
            error: "We couldn’t load this conversation. Please try again.",
            loading: false,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !accessToken) {
      return undefined;
    }

    let active = true;
    let retryTimer;
    let socket;

    const connect = () => {
      if (!active) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/ws/chat/${conversationId}/?token=${encodeURIComponent(accessToken)}`;
      socket = new WebSocket(url);
      socketRef.current = socket;
      setConnection("connecting");

      socket.onopen = () => {
        if (active) setConnection("connected");
      };
      socket.onmessage = (event) => {
        if (!active) return;
        const message = JSON.parse(event.data);
        if (message.type === "error") {
          setSendError(message.detail);
          return;
        }
        setMessageData((current) => ({
          conversationId,
          messages: mergeMessages(
            current.conversationId === conversationId ? current.messages : [],
            [message],
          ),
          error: "",
          loading: current.conversationId === conversationId ? current.loading : true,
        }));
        onNewMessage(conversationId, message);
      };
      socket.onerror = () => {
        if (active) setConnection("disconnected");
      };
      socket.onclose = (event) => {
        if (active) {
          setConnection("disconnected");
          if (event.code === 4401) {
            refreshAccessToken().catch((refreshError) => {
              if (active) {
                setSendError(
                  refreshError.response?.data?.detail ||
                    "Your session has expired. Please sign in again.",
                );
              }
            });
            return;
          }
          if (event.code === 4403) {
            setSendError("You no longer have access to this conversation.");
            return;
          }
          retryTimer = window.setTimeout(connect, 2500);
        }
      };
    };

    connect();
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      socketRef.current = null;
      socket?.close();
    };
  }, [accessToken, conversationId, onNewMessage]);

  const messages = useMemo(
    () =>
      messageData.conversationId === conversationId
        ? messageData.messages
        : [],
    [messageData, conversationId],
  );
  const loading =
    Boolean(conversationId) &&
    (messageData.conversationId !== conversationId || messageData.loading);
  const error =
    sendError ||
    (messageData.conversationId === conversationId ? messageData.error : "");

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (content) => {
    setSendError("");
    setSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "message", content }));
      } else {
        const { data } = await api.post(
          `chat/${conversationId}/messages/`,
          { content },
        );
        setMessageData((current) => ({
          conversationId,
          messages: mergeMessages(
            current.conversationId === conversationId ? current.messages : [],
            [data],
          ),
          error: "",
          loading: false,
        }));
        onNewMessage(conversationId, data);
      }
      return true;
    } catch (requestError) {
      setSendError(
        requestError.response?.data?.detail ||
          "Your message couldn’t be sent. Please try again.",
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  if (!conversation) {
    return (
      <section className="chat-panel chat-empty-panel">
        <div className="welcome-card">
          <span className="welcome-icon"><MessageCircle size={27} /></span>
          <span className="eyebrow">A little more connected</span>
          <h2>Make room for a good conversation.</h2>
          <p>
            Choose a chat from your inbox, or find someone new to say hello to.
            The best conversations often start with a simple message.
          </p>
          <div className="welcome-decoration" aria-hidden="true">
            <span /><span /><span />
          </div>
        </div>
        <span className="empty-panel-note">Made for the moments in between.</span>
      </section>
    );
  }

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <button
          aria-label="Back to conversations"
          className="icon-button mobile-back-button"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={19} />
        </button>
        <Avatar
          image={participant?.avatar}
          name={title}
          online={participant?.is_online}
        />
        <div className="chat-contact">
          <h2>{title}</h2>
          <p>
            <span className={participant?.is_online ? "status-dot is-online" : "status-dot"} />
            {participant?.is_online ? "Online now" : "Your conversation"}
          </p>
        </div>
        <div className={`connection-status ${connection}`}>
          <span />
          {connection === "connected" ? "Live" : connection === "connecting" ? "Connecting" : "Reconnecting"}
        </div>
      </header>

      <div aria-live="polite" className="messages-area">
        <div className="conversation-intro">
          <Avatar image={participant?.avatar} name={title} />
          <span className="eyebrow">A conversation with</span>
          <h3>{title}</h3>
          <p>
            {participant?.username ? `@${participant.username} · ` : ""}
            This is the beginning of something good.
          </p>
          <span className="intro-divider"><i /></span>
        </div>

        {loading ? (
          <div className="messages-state"><span className="loading-indicator" />Loading messages…</div>
        ) : messages.length ? (
          <div className="message-list">
            {messages.map((message, index) => {
              const mine = message.sender === user?.id;
              const previous = messages[index - 1];
              const showDate =
                !previous ||
                new Date(previous.created_at).toDateString() !==
                  new Date(message.created_at).toDateString();
              return (
                <div className="message-group" key={message.id}>
                  {showDate && (
                    <div className="date-divider">
                      <span>
                        {new Intl.DateTimeFormat(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(message.created_at))}
                      </span>
                    </div>
                  )}
                  <div className={`message-line ${mine ? "message-mine" : "message-theirs"}`}>
                    {!mine && (
                      <Avatar
                        image={participant?.avatar}
                        name={message.sender_display_name || title}
                      />
                    )}
                    <div className="message-content">
                      {!mine && (
                        <span className="message-sender">
                          {message.sender_display_name || message.sender_username}
                        </span>
                      )}
                      <div className="message-bubble">{message.content}</div>
                      <span className="message-meta">
                        {formatMessageTime(message.created_at)}
                        {mine && <CheckCheck aria-label="Sent" size={14} />}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endOfMessagesRef} />
          </div>
        ) : (
          <div className="first-message">
            <span className="first-message-icon"><MessageCircle size={17} /></span>
            <span>Say hello to {title}. Every friendship starts somewhere.</span>
          </div>
        )}
      </div>

      <div className="chat-compose-area">
        {error && <p className="chat-error" role="alert">{error}</p>}
        <MessageInput disabled={sending || loading} onSend={sendMessage} />
      </div>
    </section>
  );
}

export default ChatWindow;
