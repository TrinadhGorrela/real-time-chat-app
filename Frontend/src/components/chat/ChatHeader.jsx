import { useState, useEffect, useRef } from "react";
import { formatters } from "../../utils/dateFormatter";
import styles from "./ChatHeader.module.css";

const ChatHeader = ({
  contact,
  status,
  typing,
  onDeleteFriend,
  onBack,
  onClearChat,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDeleteFriend();
  };

  const handleClearChat = () => {
    setShowMenu(false);
    onClearChat();
  };

  return (
    <div className={styles.chatHeader}>
      <div className={styles.userInfo}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        )}

        <div className={styles.userAvatar}>
          <img src="/image/User.jpg" alt="Profile" />
        </div>

        <div className={styles.userDetails}>
          <span className={styles.userName}>{contact.name}</span>

          <div className={styles.statusContainer}>
            {typing ? (
              <div className={styles.typingIndicator}>Typing...</div>
            ) : (
              <div className={styles.userStatus}>
                <span
                  className={styles.statusIndicator}
                  style={{
                    background: status.isOnline ? "#31a24c" : "#8696a0",
                  }}
                ></span>
                <span className={styles.statusText}>
                  {status.isOnline
                    ? "Online"
                    : status.lastSeen
                      ? `Last seen ${formatters.relativeTime(status.lastSeen)}`
                      : "Offline"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.userActions} ref={menuRef}>
        <button className={styles.kebabBtn} onClick={toggleMenu}>
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
        {showMenu && (
          <div className={styles.actionDropdown}>
            <div
              className={`${styles.actionItem} ${styles.delete}`}
              onClick={handleDelete}
            >
              <i className="fa-solid fa-trash" style={{ color: "#8696a0" }}></i>{" "}
              Delete Friend
            </div>
            <div
              className={`${styles.actionItem} ${styles.clear}`}
              onClick={handleClearChat}
            >
              <i className="fa-solid fa-broom" style={{ color: "#8696a0" }}></i>{" "}
              Clear Chat
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
