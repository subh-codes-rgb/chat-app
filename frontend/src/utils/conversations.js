export function getConversationUser(conversation, userId) {
  return conversation?.participant_details?.find(
    (participant) => participant.id !== userId,
  );
}

export function getConversationTitle(conversation, userId) {
  if (conversation?.is_group) return conversation.name || "Group conversation";
  const participant = getConversationUser(conversation, userId);
  return participant?.display_name || participant?.username || "New conversation";
}

export function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date)
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
}
