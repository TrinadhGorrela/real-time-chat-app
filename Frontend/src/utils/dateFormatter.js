export const formatters = {
  messageTime: (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  },

  relativeTime: (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffDays < 1) return `${diffHours}h ago`;
    if (diffDays === 1)
      return `yesterday at ${formatters.messageTime(timestamp)}`;

    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${formatters.messageTime(timestamp)}`;
  },

  dateHeader: (timestamp) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msgDay = new Date(
      msgDate.getFullYear(),
      msgDate.getMonth(),
      msgDate.getDate(),
    );

    if (msgDay.getTime() === today.getTime()) return "Today";
    if (msgDay.getTime() === today.getTime() - 86400000) return "Yesterday";

    return msgDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  },
};
