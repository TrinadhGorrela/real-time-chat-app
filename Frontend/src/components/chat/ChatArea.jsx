import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import WelcomeScreen from "./WelcomeScreen";
import DateHeader from "./DateHeader";
import ConfirmModal from "../modals/ConfirmModal"; // Restored custom modal
import chatService from "../../services/chatService";
import authService from "../../services/authService";
import styles from "./ChatArea.module.css";

const ChatArea = ({ activeContact, onDeleteFriend, onBack }) => {
  const { user } = useAuth();
  const { connected, subscribe, send } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState({ isOnline: false, lastSeen: null });

  // Restored Modal States
  const [showDeleteFriendModal, setShowDeleteFriendModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // THE REF FIX: Keeps WebSockets perfectly in sync without re-subscribing
  // ─────────────────────────────────────────────────────────────
  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Load history + status when contact changes
  useEffect(() => {
    if (!activeContact || !user) return;

    setMessages([]);
    setTyping(false);
    setStatus({ isOnline: false, lastSeen: null });

    chatService
      .getChatHistory(
        user.email.toLowerCase(),
        activeContact.email.toLowerCase(),
      )
      .then((h) => setMessages(h || []))
      .catch(console.error);

    authService
      .checkStatus(activeContact.email)
      .then((d) => setStatus({ isOnline: d.isOnline, lastSeen: d.lastSeen }))
      .catch(() => {});

    if (connected) {
      send("/app/chat.readMessage", {
        sender: user.email,
        receiver: activeContact.email,
        status: "READ",
      });
    }
  }, [activeContact?.email]);

  // Single WebSocket Subscription Block
  useEffect(() => {
    if (!connected || !user) return;

    const myEmail = user.email.toLowerCase();

    const messageSub = subscribe(`/topic/private/${myEmail}`, (frame) => {
      const msg = JSON.parse(frame.body);

      // ANTI-LOOP FIX
      if (!msg.content && msg.status === "READ") return;

      const sender = msg.sender?.trim().toLowerCase();
      const recv = msg.receiver?.trim().toLowerCase();
      const contact = activeContactRef.current;
      const contactEmail = contact?.email?.toLowerCase();

      if (sender === myEmail) {
        setMessages((prev) => {
          const tempIdx = prev.findIndex(
            (m) =>
              typeof m.id === "string" &&
              m.id.startsWith("temp_") &&
              m.content === msg.content,
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = msg;
            return next;
          }
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return prev;
        });
        return;
      }

      if (sender !== contactEmail) return;

      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (contact) {
        send("/app/chat.readMessage", {
          sender: user.email,
          receiver: contact.email,
          status: "READ",
        });
      }
    });

    const typingSub = subscribe(`/topic/typing/${myEmail}`, (frame) => {
      const data = JSON.parse(frame.body);
      if (data.sender === activeContactRef.current?.email?.toLowerCase()) {
        setTyping(data.isTyping);
        clearTimeout(typingTimeoutRef.current);
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 4000);
        }
      }
    });

    const receiptSub = subscribe("/user/queue/read-receipts", (frame) => {
      const msg = JSON.parse(frame.body);
      if (msg.status === "READ") {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?.toLowerCase() === myEmail ? { ...m, status: "READ" } : m,
          ),
        );
      }
    });

    const statusSub = subscribe("/topic/status", (frame) => {
      const s = JSON.parse(frame.body);
      if (
        s.email?.toLowerCase() ===
        activeContactRef.current?.email?.toLowerCase()
      ) {
        setStatus({ isOnline: s.isOnline, lastSeen: s.lastSeen });
      }
    });

    return () => {
      messageSub?.unsubscribe();
      typingSub?.unsubscribe();
      receiptSub?.unsubscribe();
      statusSub?.unsubscribe();
    };
  }, [connected, user?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content, fileData = null) => {
    if (!activeContact || !user || !connected) return;

    const tempId = `temp_${Date.now()}`;
    const message = {
      sender: user.email,
      receiver: activeContact.email,
      content: content || "",
      status: "SENT",
      timestamp: new Date().toISOString(),
      messageType: fileData?.messageType || "TEXT",
      fileUrl: fileData?.fileUrl || "",
      fileName: fileData?.fileName || "",
      fileSize: fileData?.fileSize || 0,
    };

    setMessages((prev) => [...prev, { ...message, id: tempId }]);
    send("/app/chat", message);
  };

  const handleTyping = () => {
    if (!activeContact || !user || !connected) return;
    send("/app/chat.typing", {
      sender: user.email,
      receiver: activeContact.email,
      isTyping: true,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      send("/app/chat.typing", {
        sender: user.email,
        receiver: activeContact.email,
        isTyping: false,
      });
    }, 3000);
  };

  // Restored Custom Deletion Logic
  const handleDeleteMessageClick = (messageId) => {
    setMessageToDelete(messageId);
  };

  const confirmDeleteMessage = async () => {
    try {
      await chatService.deleteMessage(messageToDelete);
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setMessageToDelete(null);
    }
  };

  const confirmDeleteFriend = () => {
    onDeleteFriend(activeContact.email);
    setShowDeleteFriendModal(false);
  };

  const groupMessagesByDate = () => {
    const grouped = [];
    let lastKey = null;
    messages.forEach((msg) => {
      const d = new Date(msg.timestamp || Date.now());
      const key = d.toDateString();
      if (key !== lastKey) {
        grouped.push({ type: "date", date: d });
        lastKey = key;
      }
      grouped.push({ type: "message", data: msg });
    });
    return grouped;
  };

  return (
    <main className={styles.chatArea}>
      {!activeContact ? (
        <WelcomeScreen />
      ) : (
        <>
          <ChatHeader
            contact={activeContact}
            status={status}
            typing={typing}
            onDeleteFriend={() => setShowDeleteFriendModal(true)}
            onBack={onBack}
          />

          <div className={styles.messages} id="chat-messages">
            {groupMessagesByDate().map((item, i) =>
              item.type === "date" ? (
                <DateHeader key={`d-${i}`} date={item.date} />
              ) : (
                <MessageBubble
                  key={item.data.id || i}
                  message={item.data}
                  isOwn={
                    item.data.sender?.toLowerCase() ===
                    user?.email?.toLowerCase()
                  }
                  onDelete={handleDeleteMessageClick}
                />
              ),
            )}
            <div ref={messagesEndRef} />
          </div>

          <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} />
        </>
      )}

      {/* MODALS SECTION */}
      {showDeleteFriendModal && (
        <ConfirmModal
          title="Delete Contact?"
          message={`Are you sure you want to delete ${activeContact.name}? This will remove your entire chat history.`}
          onConfirm={confirmDeleteFriend}
          onCancel={() => setShowDeleteFriendModal(false)}
        />
      )}

      {messageToDelete && (
        <ConfirmModal
          title="Delete Message?"
          message="This message will be removed for you. This action cannot be undone."
          onConfirm={confirmDeleteMessage}
          onCancel={() => setMessageToDelete(null)}
        />
      )}
    </main>
  );
};

export default ChatArea;
