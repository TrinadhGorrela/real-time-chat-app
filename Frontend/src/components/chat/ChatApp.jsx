import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import NavStrip from "../navigation/NavStrip";
import Sidebar from "../sidebar/Sidebar";
import ChatArea from "./ChatArea";
import AddFriendModal from "../modals/AddFriendModal";
import RequestsModal from "../modals/RequestsModal";
import Toast from "../common/Toast";
import authService from "../../services/authService";
import friendService from "../../services/friendService";
import styles from "./ChatApp.module.css";

const ChatApp = () => {
  const { user } = useAuth();
  const { connected, subscribe } = useWebSocket();

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const [requests, setRequests] = useState([]);

  const [mobileView, setMobileView] = useState("sidebar");

  const activeContactRef = useRef(activeContact);

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  useEffect(() => {
    authService.setOnline().catch(() => {});

    const markOffline = () => authService.setOffline().catch(() => {});
    window.addEventListener("beforeunload", markOffline);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        authService.setOffline().catch(() => {});
      } else {
        authService.setOnline().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      markOffline();
      window.removeEventListener("beforeunload", markOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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

        const currentActiveEmail = activeContactRef.current?.email?.toLowerCase();

        if (currentActiveEmail !== sender) {
          setUnreadCounts((prev) => ({
            ...prev,
            [sender]: (prev[sender] || 0) + 1,
          }));
          showToast(`${msg.sender}: ${msg.content || "📎 File"}`);
          try {
            new Audio("/audio/notification.mp3").play().catch(() => {});
          } catch (_) {}
        }
      },
    );

    return () => sub?.unsubscribe();
  }, [connected, user?.email]);

  const loadContacts = () =>
    friendService.getContacts().then(setContacts).catch(console.error);

  const updateRequestBadge = () =>
    friendService
      .getPendingRequests()
      .then((r) => {
        setPendingCount(r.length);
        setRequests(r);
      })
      .catch(() => {});

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setUnreadCounts((prev) => ({ ...prev, [contact.email.toLowerCase()]: 0 }));
    setMobileView("chat");
  };

  const handleBackToSidebar = () => {
    setMobileView("sidebar");
    setActiveContact(null);
  };

  const handleDeleteFriend = async (friendEmail) => {
    if (
      !window.confirm("Delete this conversation? This action cannot be undone.")
    )
      return;
    try {
      await friendService.deleteFriend(friendEmail);
      setActiveContact(null);
      setMobileView("sidebar");
      loadContacts();
      showToast("Contact deleted successfully");
    } catch {
      showToast("Failed to delete contact");
    }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  return (
    <div className={styles.appContainer}>
      <NavStrip
        onAddFriend={() => setShowAddModal(true)}
        onShowRequests={() => {
          setShowRequestsModal(true);
          setPendingCount(0);
        }}
        pendingCount={pendingCount}
        mobileView={mobileView}
      />

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
        />
      </div>

      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            showToast("Friend request sent!");
            setShowAddModal(false);
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

      {toast.show && <Toast message={toast.message} />}
    </div>
  );
};

export default ChatApp;
