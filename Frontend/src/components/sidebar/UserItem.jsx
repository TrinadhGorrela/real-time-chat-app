import styles from "./UserItem.module.css";

const UserItem = ({ contact, isActive, unreadCount, onClick }) => {
  return (
    <div
      className={`${styles.userItem} ${isActive ? styles.active : ""} ${unreadCount > 0 ? styles.hasNewMessage : ""}`}
      onClick={onClick}
    >
      <div className={styles.userAvatar}>
        <img src="/image/User.jpg" alt={contact.name} />
      </div>

      <div className={styles.userInfo}>
        <div className={styles.userName}>{contact.name}</div>
        <div className={styles.userEmail}>{contact.email}</div>
      </div>
      {unreadCount > 0 && (
        <span className={styles.notificationBadge}>{unreadCount}</span>
      )}
    </div>
  );
};

export default UserItem;
