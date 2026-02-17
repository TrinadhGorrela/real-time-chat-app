import { useState } from "react";
import { formatTime2 } from "../../utils/dateFormatter";
import styles from "./ChatHeader.module.css";

const ChatHeader = ({ contact, status, typing, onDeleteFriend, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDeleteFriend();
  };

  return (
    <div
      className={styles.chatHeader}
      onClick={() => showMenu && setShowMenu(false)}
    >
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
                      ? `Last seen ${formatTime2(status.lastSeen)}`
                      : "Offline"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.userActions}>
        <button className={styles.kebabBtn} onClick={toggleMenu}>
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
        {showMenu && (
          <div className={styles.actionDropdown}>
            <div
              className={`${styles.actionItem} ${styles.danger}`}
              onClick={handleDelete}
            >
              <i className="fa-solid fa-trash"></i> Delete Friend
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
