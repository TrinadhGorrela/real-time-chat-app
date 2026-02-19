import { useEffect, useRef } from "react";
import styles from "./ProfileMenu.module.css";

const ProfileMenu = ({
  user,
  pendingCount,
  onAddFriend,
  onOpenRequests,
  onLogout,
  onClose,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className={styles.profileMenu} ref={menuRef}>
      <div className={styles.menuHeader}>
        <div style={{ fontSize: "0.8rem" }}>Signed in as</div>
        <div className={styles.userName}>{user?.name || "User"}</div>
      </div>

      <div className={styles.menuItem} onClick={onAddFriend}>
        <i className="fa-solid fa-user-plus"></i> Add Friend
      </div>

      <div className={styles.menuItem} onClick={onOpenRequests}>
        <i className="fa-solid fa-envelope"></i> Requests
        {pendingCount > 0 && (
          <span className={styles.badge}>{pendingCount}</span>
        )}
      </div>

      <div className={`${styles.menuItem} ${styles.danger}`} onClick={onLogout}>
        <i className="fa-solid fa-right-from-bracket"></i> Logout
      </div>
    </div>
  );
};

export default ProfileMenu;
