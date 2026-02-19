import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import WelcomeScreen from "./WelcomeScreen";
import DateHeader from "./DateHeader";
import ConfirmModal from "../modals/ConfirmModal";
import MediaModal from "../modals/MediaModal";
import chatService from "../../services/chatService";
import authService from "../../services/authService";
import styles from "./ChatArea.module.css";

const ChatArea = ({ activeContact, onDeleteFriend, onBack }) => {
  const { user } = useAuth();
  const { connected, subscribe, send } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState({ isOnline: false, lastSeen: null });
  const [showDeleteFriendModal, setShowDeleteFriendModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [mediaToView, setMediaToView] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  useEffect(() => {
    if (!activeContact || !user) return;

    setMessages([]);
    setTyping(false);
    setStatus({ isOnline: false, lastSeen: null });
    setMediaToView(null);
    setLoading(true);

    chatService
      .getChatHistory(
        user.email.toLowerCase(),
        activeContact.email.toLowerCase(),
      )
      .then((h) => setMessages(h || []))
      .catch(console.error)
      .finally(() => setLoading(false));

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

  useEffect(() => {
    if (!connected || !user) return;

    const myEmail = user.email.toLowerCase();

    const messageSub = subscribe(`/topic/private/${myEmail}`, (frame) => {
      const msg = JSON.parse(frame.body);

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
      statusSub?.unsubscribe();
    };
  }, [connected, user?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleReadReceipt = () => {
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.sender?.toLowerCase() === user?.email?.toLowerCase()
            ? { ...m, status: "READ" }
            : m,
        ),
      );
    };

    window.addEventListener("messages-read", handleReadReceipt);
    return () => window.removeEventListener("messages-read", handleReadReceipt);
  }, [user?.email]);

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

  const handleDeleteMessageClick = (messageId) => {
    setMessageToDelete(messageId);
  };

  const handleMediaClick = (fileUrl, type) => {
    setMediaToView({ fileUrl, type });
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
            {loading ? (
              <div style={{ 
                flex: 1, 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                color: "#00a884" 
              }}>
                <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              </div>
            ) : (
              <>
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
                      onMediaClick={handleMediaClick}
                    />
                  ),
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} />
        </>
      )}

      {showDeleteFriendModal && (
        <ConfirmModal
          title="Delete Contact"
          message={`Are you sure you want to delete ${activeContact.name} ? This will remove your entire chat history.`}
          onConfirm={confirmDeleteFriend}
          onCancel={() => setShowDeleteFriendModal(false)}
        />
      )}

      {messageToDelete && (
        <ConfirmModal
          title="Delete Message"
          message="This message will be delete from you. This action cannot be undone."
          onConfirm={confirmDeleteMessage}
          onCancel={() => setMessageToDelete(null)}
        />
      )}

      {mediaToView && (
        <MediaModal
          fileUrl={mediaToView.fileUrl}
          type={mediaToView.type}
          onClose={() => setMediaToView(null)}
        />
      )}
    </main>
  );
};

export default ChatArea;
