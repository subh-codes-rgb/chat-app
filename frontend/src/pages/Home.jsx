import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/axios";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/useAuth";
import Settings from "./Settings";

function Home() {
  const { user, accessToken, logout, updateUser } = useAuth();
  const { username: inviteUsername } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [peopleView, setPeopleView] = useState(false);
  const [settingsView, setSettingsView] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [startingConversation, setStartingConversation] = useState(false);
  const handledInvite = useRef("");

  useEffect(() => {
    let active = true;
    api
      .get("conversations/")
      .then(({ data }) => {
        if (!active) return;
        setConversations(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError("We couldn’t load your chats. Refresh the page to try again.");
      })
      .finally(() => {
        if (active) setLoadingConversations(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!peopleView) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      setPeopleLoading(true);
      api
        .get("accounts/users/", {
          params: {
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(onlineOnly ? { online: "true" } : {}),
          },
        })
        .then(({ data }) => {
          if (active) setPeople(data);
        })
        .catch(() => {
          if (active) setError("We couldn’t search for people. Please try again.");
        })
        .finally(() => {
          if (active) setPeopleLoading(false);
        });
    }, search ? 220 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [onlineOnly, peopleView, search]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId],
  );

  const handleNewMessage = useCallback((conversationId, message) => {
    setConversations((current) =>
      current
        .map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                last_message: message,
                updated_at: message.created_at,
              }
            : conversation,
        )
        .sort(
          (first, second) =>
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime(),
        ),
    );
  }, []);

  const handleSelectPerson = useCallback(async (person) => {
    setStartingConversation(true);
    setError("");
    try {
      const { data } = await api.post("conversations/", {
        participants: [person.id],
        is_group: false,
      });
      setConversations((current) =>
        [data, ...current.filter((item) => item.id !== data.id)].sort(
          (first, second) =>
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime(),
        ),
      );
      setSelectedId(data.id);
      setPeopleView(false);
      setSearch("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We couldn’t start a conversation. Please try again.",
      );
    } finally {
      setStartingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (!inviteUsername || loadingConversations || !user?.id) return;
    const inviteKey = `${user.id}:${inviteUsername.toLowerCase()}`;
    if (handledInvite.current === inviteKey) return;
    handledInvite.current = inviteKey;

    api
      .get("accounts/users/", { params: { search: inviteUsername } })
      .then(({ data }) => {
        const person = data.find(
          (item) => item.username.toLowerCase() === inviteUsername.toLowerCase(),
        );
        if (!person) {
          setError("We couldn’t find that Gather username. Ask them to share a new link.");
          return;
        }
        handleSelectPerson(person);
      })
      .catch(() =>
        setError("We couldn’t open this connection link. Please try again."),
      );
  }, [handleSelectPerson, inviteUsername, loadingConversations, user?.id]);

  const showPeople = () => {
    setSettingsView(false);
    setPeopleView(true);
    setSearch("");
    setError("");
  };
  const showChats = () => {
    setSettingsView(false);
    setPeopleView(false);
    setSearch("");
    setError("");
  };
  const showSettings = () => {
    setSettingsView(true);
    setPeopleView(false);
    setSearch("");
    setError("");
  };

  return (
    <main className="app-shell">
      <div className="workspace">
        <Sidebar
          conversations={conversations}
          onLogout={logout}
          onSearchChange={setSearch}
          onSelectConversation={setSelectedId}
          onSelectPerson={handleSelectPerson}
          onShowChats={showChats}
          onShowPeople={showPeople}
          onShowSettings={showSettings}
          settingsView={settingsView}
          peopleView={peopleView}
          peopleLoading={peopleLoading || startingConversation}
          onlineOnly={onlineOnly}
          onOnlineOnlyChange={setOnlineOnly}
          search={search}
          selectedId={selectedId}
          users={people}
          user={user}
        />
        <div className="chat-column">
          {error && (
            <div className="app-notice" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} type="button">Dismiss</button>
            </div>
          )}
          {settingsView ? (
            <Settings
              onBack={showChats}
              onProfileUpdated={updateUser}
              user={user}
            />
          ) : loadingConversations ? (
            <section className="chat-panel chat-empty-panel">
              <div className="messages-state"><span className="loading-indicator" />Opening your inbox…</div>
            </section>
          ) : (
            <ChatWindow
              accessToken={accessToken}
              conversation={selectedConversation}
              onBack={() => setSelectedId(null)}
              onNewMessage={handleNewMessage}
              user={user}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default Home;
