export const API_BASE_URL = "http://localhost:8081";
export const WS_URL = "http://localhost:8081/ws";

export const COLORS = {
  teal: "#00a884",
  darkTeal: "#008f6f",
  green: "#25d366",
  bg: "#efeae2",
  dark: "#111b21",
  sentBubble: "#d9fdd3",
  recvBubble: "#ffffff",
  grayText: "#54656f",
  blueTick: "#53bdeb",
  navStrip: "#202c33",
};

export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "pdf",
  "doc",
  "docx",
  "txt",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const WS_TOPICS = {
  privateMessage: (email) => `/topic/private/${email.toLowerCase()}`,
  status: "/topic/status",
  typing: (email) => `/topic/typing/${email.toLowerCase()}`,
  readReceipts: "/user/queue/read-receipts",
};

export const WS_DESTINATIONS = {
  chat: "/app/chat",
  typing: "/app/chat.typing",
  readMessage: "/app/chat.readMessage",
  statusUpdate: "/app/status.update",
};

export const MESSAGE_TYPES = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  DOCUMENT: "DOCUMENT",
  FILE: "FILE",
};

export const MESSAGE_STATUS = {
  SENT: "SENT",
  READ: "READ",
};
