import styles from "./UserItem.module.css";

const UserItem = ({ contact, isActive, unreadCount, onClick }) => {
  return (
    <div
      // FIX 1: Matched the unread class to 'hasNewMessage' from your CSS
      className={`${styles.userItem} ${isActive ? styles.active : ""} ${unreadCount > 0 ? styles.hasNewMessage : ""}`}
      onClick={onClick}
    >
      {/* FIX 2: Changed 'avatar' to 'userAvatar' */}
      <div className={styles.userAvatar}>
        <img src="/image/User.jpg" alt={contact.name} />
      </div>

      {/* FIX 3: Changed 'info' to 'userInfo' */}
      <div className={styles.userInfo}>
        {/* FIX 4: Changed 'name' to 'userName' */}
        <div className={styles.userName}>{contact.name}</div>

        {/* FIX 5: Added the email string so your .userEmail CSS is used! */}
        <div className={styles.userEmail}>{contact.email}</div>
      </div>

      {/* FIX 6: Changed 'badge' to 'notificationBadge' */}
      {unreadCount > 0 && (
        <span className={styles.notificationBadge}>{unreadCount}</span>
      )}
    </div>
  );
};

export default UserItem;
