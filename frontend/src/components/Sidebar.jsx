import {
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  formatMessageTime,
  getConversationTitle,
  getConversationUser,
  getInitials,
} from "../utils/conversations";

function Avatar({ name, image, online = false, size = "" }) {
  return (
    <span className={`avatar ${size ? `avatar-${size}` : ""}`}>
      {image ? <img alt="" src={image} /> : <span>{getInitials(name)}</span>}
      {online && <i className="online-dot" />}
    </span>
  );
}

function Sidebar({
  user,
  conversations,
  selectedId,
  peopleView,
  users,
  peopleLoading,
  onlineOnly,
  onOnlineOnlyChange,
  search,
  onSearchChange,
  onSelectConversation,
  onSelectPerson,
  onShowChats,
  onShowPeople,
  onShowSettings,
  settingsView,
  onLogout,
}) {
  const isPeopleView = peopleView && !settingsView;
  const visibleConversations = conversations.filter((conversation) =>
    getConversationTitle(conversation, user?.id)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <aside
      className={`sidebar ${selectedId || settingsView ? "sidebar-has-selection" : ""}`}
    >
      <header className="sidebar-header">
        <Link className="brand" to="/home">
          <span className="brand-mark"><MessageCircle size={18} /></span>
          <span>gather</span>
        </Link>
        <button
          aria-label="Start a new conversation"
          className="icon-button new-chat-button"
          onClick={onShowPeople}
          title="New conversation"
          type="button"
        >
          <MessageSquarePlus size={19} />
        </button>
      </header>

      <div className="sidebar-greeting">
        <p>Your people, in one place.</p>
        <h1>Messages</h1>
      </div>

      <label className="search-box">
        <Search aria-hidden="true" size={17} />
        <input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={isPeopleView ? "Find someone…" : "Search chats…"}
          type="search"
          value={search}
        />
        {search && (
          <button
            aria-label="Clear search"
            className="search-clear"
            onClick={() => onSearchChange("")}
            type="button"
          >
            ×
          </button>
        )}
      </label>

      <nav aria-label="Message views" className="sidebar-tabs">
        <button
          aria-current={!isPeopleView && !settingsView ? "page" : undefined}
          className={!isPeopleView && !settingsView ? "sidebar-tab active" : "sidebar-tab"}
          onClick={onShowChats}
          type="button"
        >
          <MessageCircle size={16} />
          Chats
          {!isPeopleView && !settingsView && (
            <span className="tab-count">{conversations.length}</span>
          )}
        </button>
        <button
          aria-current={isPeopleView ? "page" : undefined}
          className={isPeopleView ? "sidebar-tab active" : "sidebar-tab"}
          onClick={onShowPeople}
          type="button"
        >
          <Users size={16} />
          People
        </button>
      </nav>

      <div className="sidebar-list-heading">
        <span>{isPeopleView ? "FIND YOUR PEOPLE" : "RECENT CHATS"}</span>
        {isPeopleView && (
          <label className="online-filter">
            <input
              checked={onlineOnly}
              onChange={(event) => onOnlineOnlyChange(event.target.checked)}
              type="checkbox"
            />
            Online
          </label>
        )}
      </div>

      <div className="conversation-list">
        {isPeopleView ? (
          peopleLoading ? (
            <div className="list-state"><span className="loading-indicator" />Finding people…</div>
          ) : users.length ? (
            users.map((person) => {
              const name = person.display_name || person.username;
              return (
                <button
                  className="person-row"
                  key={person.id}
                  onClick={() => onSelectPerson(person)}
                  type="button"
                >
                  <Avatar
                    image={person.avatar}
                    name={name}
                    online={person.is_online}
                  />
                  <span className="person-row-copy">
                    <strong>{name}</strong>
                    <span>{person.bio || `@${person.username}`}</span>
                  </span>
                  <span className="person-start" aria-hidden="true">
                    <MessageSquarePlus size={15} />
                  </span>
                </button>
              );
            })
          ) : (
            <div className="list-empty">
              <span className="empty-icon"><Users size={19} /></span>
              <strong>{search ? "No one found" : "It’s quiet here"}</strong>
              <span>
                {search
                  ? "Try another name or username."
                  : onlineOnly
                    ? "Try again later or turn off Online to see everyone."
                    : "Search by name or username to find someone new."}
              </span>
            </div>
          )
        ) : visibleConversations.length ? (
          visibleConversations.map((conversation) => {
            const person = getConversationUser(conversation, user?.id);
            const title = getConversationTitle(conversation, user?.id);
            const preview = conversation.last_message;
            return (
              <button
                aria-current={selectedId === conversation.id ? "true" : undefined}
                className={`conversation-row ${selectedId === conversation.id ? "selected" : ""}`}
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                <Avatar
                  image={person?.avatar}
                  name={title}
                  online={person?.is_online}
                  size="large"
                />
                <span className="conversation-row-copy">
                  <span className="conversation-row-top">
                    <strong>{title}</strong>
                    <time>{formatMessageTime(preview?.created_at || conversation.updated_at)}</time>
                  </span>
                  <span className="conversation-preview">
                    {preview
                      ? `${preview.sender === user?.id ? "You: " : ""}${preview.content}`
                      : "Start a conversation"}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="list-empty">
            <span className="empty-icon"><MessageCircle size={19} /></span>
            <strong>{search ? "No chats found" : "Your inbox is open"}</strong>
            <span>
              {search
                ? "Try searching for another name."
                : "Find someone to start a conversation."}
            </span>
            {!search && (
              <button className="text-button" onClick={onShowPeople} type="button">
                Find people <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="sidebar-profile">
        <Avatar
          image={user?.avatar}
          name={user?.display_name || user?.username || "You"}
        />
        <span className="profile-copy">
          <strong>{user?.display_name || user?.username}</strong>
          <span>@{user?.username}</span>
        </span>
        <button
          aria-label="Settings"
          aria-current={settingsView ? "page" : undefined}
          className={`icon-button ${settingsView ? "settings-button active" : "settings-button"}`}
          onClick={onShowSettings}
          title="Settings"
          type="button"
        >
          <Settings size={17} />
        </button>
        <button
          aria-label="Sign out"
          className="icon-button logout-button"
          onClick={onLogout}
          title="Sign out"
          type="button"
        >
          <LogOut size={17} />
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;
