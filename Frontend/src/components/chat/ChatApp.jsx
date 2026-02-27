import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import Sidebar from "../sidebar/Sidebar";
import ChatArea from "./ChatArea";
import AddFriendModal from "../modals/AddFriendModal";
import RequestsModal from "../modals/RequestsModal";
import SettingsModal from "../modals/SettingsModal";
import LogoutModal from "../modals/LogoutModal";
import { useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import friendService from "../../services/friendService";
import styles from "./ChatApp.module.css";

const ChatApp = () => {
  const { user, logout } = useAuth();
  const { connected, subscribe } = useWebSocket();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const [requests, setRequests] = useState([]);
  const [mobileView, setMobileView] = useState("sidebar");
  const [isLoading, setIsLoading] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? parseInt(saved, 10) : 350;
  });
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ width: 0, clientX: 0 });

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const delta = e.clientX - dragStartRef.current.clientX;
      let newWidth = dragStartRef.current.width + delta;
      if (newWidth < 250) newWidth = 250;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", sidebarWidth);
  }, [sidebarWidth]);

  const activeContactRef = useRef(activeContact);

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }

  function loadContacts() {
    setIsLoading(true);
    return friendService
      .getContacts()
      .then((data) => {
        setContacts(data);
        const counts = {};
        data.forEach((c) => {
          if (c.unreadCount > 0) {
            counts[c.email.toLowerCase()] = c.unreadCount;
          }
        });
        setUnreadCounts((prev) => ({ ...prev, ...counts }));
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateRequestBadge() {
    return friendService
      .getPendingRequests()
      .then((r) => {
        setPendingCount(r.length);
        setRequests(r);
      })
      .catch(() => {});
  }

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  useEffect(() => {
    loadContacts();
    updateRequestBadge();
  }, []);

  useEffect(() => {
    if (!connected || !user) return;

    const sub = subscribe(
      `/topic/private/${user.email.toLowerCase()}`,
      (frame) => {
        const msg = JSON.parse(frame.body);

        if (msg.type === "READ_RECEIPT") {
          const reader = msg.reader?.toLowerCase();

          if (activeContactRef.current?.email?.toLowerCase() === reader) {
            window.dispatchEvent(new Event("messages-read"));
          }
          return;
        }

        const sender = msg.sender?.toLowerCase();
        const myEmail = user.email.toLowerCase();

        if (!sender || sender === myEmail) return;

        const currentActiveEmail =
          activeContactRef.current?.email?.toLowerCase();

        if (currentActiveEmail !== sender) {
          setUnreadCounts((prev) => ({
            ...prev,
            [sender]: (prev[sender] || 0) + 1,
          }));
          showToast(`${msg.sender}: ${msg.content || "📎 File"}`);
          new Audio("/audio/notification.mp3").play().catch(() => {});
        }

        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.email.toLowerCase() === sender
              ? {
                  ...contact,
                  lastMessageTime: msg.timestamp || new Date().toISOString(),
                }
              : contact,
          ),
        );
      },
    );

    const statusSub = subscribe("/topic/status", (frame) => {
      const s = JSON.parse(frame.body);
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.email.toLowerCase() === s.email?.toLowerCase()
            ? { ...contact, isOnline: s.isOnline, lastSeen: s.lastSeen }
            : contact,
        ),
      );
    });

    return () => {
      sub?.unsubscribe();
      statusSub?.unsubscribe();
    };
  }, [connected, user?.email]);

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setUnreadCounts((prev) => ({ ...prev, [contact.email.toLowerCase()]: 0 }));
    setMobileView("chat");
  };

  const handleBackToSidebar = () => {
    setMobileView("sidebar");
    setActiveContact(null);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteFriend = async (friendEmail) => {
    try {
      await friendService.deleteFriend(friendEmail);
      setActiveContact(null);
      setMobileView("sidebar");
      loadContacts();
      showToast("Contact deleted successfully");
    } catch (error) {
      console.error("Failed to delete contact:", error);
      showToast("Failed to delete contact");
    }
  };

  return (
    <div
      className={styles.appContainer}
      style={{
        "--sidebar-width": `${sidebarWidth}px`,
        userSelect: isResizing ? "none" : "auto",
      }}
    >
      <div
        className={`${styles.sidebarWrapper} ${
          mobileView === "chat" ? styles.sidebarHidden : ""
        }`}
      >
        <Sidebar
          contacts={contacts}
          activeContact={activeContact}
          onSelectContact={handleSelectContact}
          unreadCounts={unreadCounts}
          isLoading={isLoading}
          user={user}
          pendingCount={pendingCount}
          onAddFriend={() => setShowAddModal(true)}
          onShowRequests={() => {
            setShowRequestsModal(true);
            setPendingCount(0);
          }}
          onSettingsClick={() => setShowSettingsModal(true)}
          onLogoutClick={() => setShowLogoutModal(true)}
        />
        <div
          className={styles.resizer}
          onMouseDown={(e) => {
            setIsResizing(true);
            dragStartRef.current = { width: sidebarWidth, clientX: e.clientX };
          }}
        />
      </div>

      <div
        className={`${styles.chatWrapper} ${
          mobileView === "sidebar" ? styles.chatHidden : ""
        }`}
      >
        <ChatArea
          activeContact={activeContact}
          onDeleteFriend={handleDeleteFriend}
          onBack={handleBackToSidebar}
          onMessageSent={(contactEmail, timestamp) => {
            setContacts((prevContacts) =>
              prevContacts.map((contact) =>
                contact.email.toLowerCase() === contactEmail.toLowerCase()
                  ? { ...contact, lastMessageTime: timestamp }
                  : contact,
              ),
            );
          }}
        />
      </div>

      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            showToast("Friend request sent!");
          }}
        />
      )}

      {showRequestsModal && (
        <RequestsModal
          requests={requests}
          onClose={() => setShowRequestsModal(false)}
          onAccept={() => {
            loadContacts();
            updateRequestBadge();
          }}
          onDecline={updateRequestBadge}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {toast.show && <Toast message={toast.message} />}
    </div>
  );
};

export default ChatApp;
